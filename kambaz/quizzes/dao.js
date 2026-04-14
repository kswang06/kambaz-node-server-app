import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

function normalizeQuestion(question) {
  return {
    _id: question._id || uuidv4(),
    type: question.type || "MULTIPLE_CHOICE",
    title: question.title || "New Question",
    points: Number(question.points ?? 0),
    question: question.question || "",
    choices: (question.choices || []).map((choice) => ({
      _id: choice._id || uuidv4(),
      text: choice.text || "",
      isCorrect: Boolean(choice.isCorrect),
    })),
    trueFalseAnswer: question.trueFalseAnswer ?? true,
    blankAnswers: (question.blankAnswers || []).map((answer) => `${answer}`),
    caseSensitive: Boolean(question.caseSensitive),
  };
}

function normalizeQuiz(quiz) {
  const questions = (quiz.questions || []).map(normalizeQuestion);
  return {
    ...quiz,
    title: quiz.title || "New Quiz",
    description: quiz.description || "",
    questions,
    howManyAttempts: Math.max(
      1,
      Number(quiz.howManyAttempts ?? (quiz.multipleAttempts ? 2 : 1))
    ),
  };
}

export default function QuizzesDao() {
  const findQuizzesForCourse = (courseId) =>
    model.find({ course: courseId }).sort({ createdAt: -1 });

  const findQuizById = (quizId) => model.findById(quizId);

  const createQuiz = (quiz) =>
    model.create(
      normalizeQuiz({
        ...quiz,
        _id: quiz._id || uuidv4(),
      })
    );

  const updateQuiz = async (quizId, quizUpdates) => {
    const { _id, __v, createdAt, updatedAt, ...rest } = quizUpdates;
    const normalizedUpdates = normalizeQuiz(rest);
    const result = await model.updateOne(
      { _id: quizId },
      { $set: normalizedUpdates }
    );
    return result.modifiedCount > 0 || result.matchedCount > 0;
  };

  const deleteQuiz = (quizId) => model.deleteOne({ _id: quizId });

  const deleteQuizzesForCourse = (courseId) => model.deleteMany({ course: courseId });

  return {
    findQuizzesForCourse,
    findQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    deleteQuizzesForCourse,
  };
}
