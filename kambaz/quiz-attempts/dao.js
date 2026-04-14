import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function QuizAttemptsDao() {
  const findAttemptsForQuizAndUser = (quizId, userId) =>
    model.find({ quiz: quizId, user: userId }).sort({ attemptNumber: -1, submittedAt: -1 });

  const findLatestAttemptForQuizAndUser = (quizId, userId) =>
    model.findOne({ quiz: quizId, user: userId }).sort({ attemptNumber: -1, submittedAt: -1 });

  const createAttempt = (attempt) =>
    model.create({ ...attempt, _id: attempt._id || uuidv4() });

  const deleteAttemptsForQuiz = (quizId) => model.deleteMany({ quiz: quizId });
  const deleteAttemptsForCourse = (courseId) => model.deleteMany({ course: courseId });

  return {
    findAttemptsForQuizAndUser,
    findLatestAttemptForQuizAndUser,
    createAttempt,
    deleteAttemptsForQuiz,
    deleteAttemptsForCourse,
  };
}
