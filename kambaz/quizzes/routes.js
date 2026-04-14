import { v4 as uuidv4 } from "uuid";
import QuizzesDao from "./dao.js";
import QuizAttemptsDao from "../quiz-attempts/dao.js";
import EnrollmentsDao from "../enrollments/dao.js";

function parseDate(value) {
  if (!value) {
    return null;
  }
  return new Date(value);
}

function getQuestions(quiz) {
  if (!quiz || !Array.isArray(quiz.questions)) {
    return [];
  }
  return quiz.questions;
}

function getAnswers(answers) {
  if (!Array.isArray(answers)) {
    return [];
  }
  return answers;
}

function calculateQuizPoints(quiz) {
  const questions = getQuestions(quiz);
  let total = 0;

  for (const question of questions) {
    total += Number(question.points || 0);
  }

  return total;
}

function getAvailabilityStatus(quiz) {
  const now = new Date();
  const availableDate = parseDate(quiz.availableDate);
  const untilDate = parseDate(quiz.untilDate);

  if (availableDate && now < availableDate) {
    return {
      status: "NOT_AVAILABLE",
      label: `Not available until ${quiz.availableDate}`,
    };
  }

  if (untilDate && now > untilDate) {
    return {
      status: "CLOSED",
      label: "Closed",
    };
  }

  return {
    status: "AVAILABLE",
    label: "Available",
  };
}

function sanitizeQuestionForStudents(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];

  return {
    _id: question._id,
    type: question.type,
    title: question.title,
    points: question.points,
    question: question.question,
    choices: choices.map((choice) => ({
      _id: choice._id,
      text: choice.text,
    })),
    blankAnswers: [],
  };
}

function normalizeString(value, caseSensitive) {
  let text = "";

  if (value !== undefined && value !== null) {
    text = `${value}`.trim();
  }

  if (caseSensitive) {
    return text;
  }

  return text.toLowerCase();
}

function scoreTrueFalseQuestion(question, submittedAnswer) {
  if (submittedAnswer === undefined || submittedAnswer === null || submittedAnswer === "") {
    return {
      correct: false,
      earnedPoints: 0,
      correctAnswer: Boolean(question.trueFalseAnswer),
    };
  }

  let answer = submittedAnswer;
  if (typeof submittedAnswer === "string") {
    answer = submittedAnswer.toLowerCase() === "true";
  } else {
    answer = Boolean(submittedAnswer);
  }

  const correct = answer === Boolean(question.trueFalseAnswer);

  return {
    correct,
    earnedPoints: correct ? Number(question.points || 0) : 0,
    correctAnswer: Boolean(question.trueFalseAnswer),
  };
}

function scoreFillBlankQuestion(question, submittedAnswer) {
  const blankAnswers = Array.isArray(question.blankAnswers) ? question.blankAnswers : [];

  if (submittedAnswer === undefined || submittedAnswer === null || submittedAnswer === "") {
    return {
      correct: false,
      earnedPoints: 0,
      correctAnswer: blankAnswers,
    };
  }

  const normalizedSubmitted = normalizeString(submittedAnswer, question.caseSensitive);
  let correct = false;

  for (const answer of blankAnswers) {
    if (normalizeString(answer, question.caseSensitive) === normalizedSubmitted) {
      correct = true;
      break;
    }
  }

  return {
    correct,
    earnedPoints: correct ? Number(question.points || 0) : 0,
    correctAnswer: blankAnswers,
  };
}

function scoreMultipleChoiceQuestion(question, submittedAnswer) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  let selectedChoice = null;
  let correctChoice = null;

  for (const choice of choices) {
    if (!correctChoice && choice.isCorrect) {
      correctChoice = choice;
    }

    if (
      choice._id === submittedAnswer ||
      choice.text === submittedAnswer ||
      `${choice.text}` === `${submittedAnswer || ""}`
    ) {
      selectedChoice = choice;
    }
  }

  const correct = Boolean(selectedChoice && selectedChoice.isCorrect);

  return {
    correct,
    earnedPoints: correct ? Number(question.points || 0) : 0,
    correctAnswer: correctChoice
      ? { _id: correctChoice._id, text: correctChoice.text }
      : null,
  };
}

function scoreQuestion(question, submittedAnswer) {
  if (question.type === "TRUE_FALSE") {
    return scoreTrueFalseQuestion(question, submittedAnswer);
  }

  if (question.type === "FILL_IN_THE_BLANK") {
    return scoreFillBlankQuestion(question, submittedAnswer);
  }

  return scoreMultipleChoiceQuestion(question, submittedAnswer);
}

function evaluateQuiz(quiz, answers) {
  const questions = getQuestions(quiz);
  const answerList = getAnswers(answers);
  const answerMap = new Map();

  for (const answer of answerList) {
    answerMap.set(answer.questionId, answer.answer);
  }

  const results = [];
  for (const question of questions) {
    const submittedAnswer = answerMap.get(question._id);
    const evaluation = scoreQuestion(question, submittedAnswer);
    results.push({
      questionId: question._id,
      submittedAnswer,
      correct: evaluation.correct,
      earnedPoints: evaluation.earnedPoints,
      correctAnswer: evaluation.correctAnswer,
    });
  }

  let score = 0;
  for (const result of results) {
    score += Number(result.earnedPoints || 0);
  }

  return {
    results,
    score,
    totalPoints: calculateQuizPoints(quiz),
  };
}

function buildQuizSummary(quiz, lastAttempt, includeAnswers) {
  let summary = {
    ...quiz.toObject(),
    points: calculateQuizPoints(quiz),
    numberOfQuestions: getQuestions(quiz).length,
    availability: getAvailabilityStatus(quiz),
    lastAttempt: null,
  };

  if (lastAttempt) {
    summary.lastAttempt = {
      attemptNumber: lastAttempt.attemptNumber,
      score: lastAttempt.score,
      totalPoints: lastAttempt.totalPoints,
      submittedAt: lastAttempt.submittedAt,
    };

    if (includeAnswers) {
      summary.lastAttempt.results = lastAttempt.results;
    }
  }

  return summary;
}

export default function QuizzesRoutes(app) {
  const quizzesDao = QuizzesDao();
  const attemptsDao = QuizAttemptsDao();
  const enrollmentsDao = EnrollmentsDao();

  function getCurrentUser(req, res) {
    const currentUser = req.session.currentUser;

    if (!currentUser) {
      res.sendStatus(401);
      return null;
    }

    return currentUser;
  }

  async function requireCourseAccess(req, res, courseId) {
    const currentUser = getCurrentUser(req, res);
    if (!currentUser) {
      return null;
    }

    const isEnrolled = await enrollmentsDao.isUserEnrolledInCourse(
      currentUser._id,
      courseId
    );

    if (!isEnrolled) {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  }

  async function requireFacultyForCourse(req, res, courseId) {
    const currentUser = await requireCourseAccess(req, res, courseId);
    if (!currentUser) {
      return null;
    }

    if (currentUser.role !== "FACULTY") {
      res.sendStatus(403);
      return null;
    }

    return currentUser;
  }

  async function findQuizOrSend404(res, quizId) {
    const quiz = await quizzesDao.findQuizById(quizId);

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return null;
    }

    return quiz;
  }

  async function findQuizzesForCourse(req, res) {
    const courseId = req.params.courseId;
    const currentUser = await requireCourseAccess(req, res, courseId);
    if (!currentUser) {
      return;
    }

    const quizzes = await quizzesDao.findQuizzesForCourse(courseId);
    const quizSummaries = [];

    for (const quiz of quizzes) {
      if (currentUser.role !== "FACULTY" && !quiz.published) {
        continue;
      }

      let lastAttempt = null;
      if (currentUser.role === "STUDENT") {
        lastAttempt = await attemptsDao.findLatestAttemptForQuizAndUser(
          quiz._id,
          currentUser._id
        );
      }

      quizSummaries.push(buildQuizSummary(quiz, lastAttempt, false));
    }

    res.json(quizSummaries);
  }

  async function createQuizForCourse(req, res) {
    const courseId = req.params.courseId;
    const currentUser = await requireFacultyForCourse(req, res, courseId);
    if (!currentUser) {
      return;
    }

    const newQuiz = await quizzesDao.createQuiz({
      course: courseId,
      title: "New Quiz",
      description: "",
      ...req.body,
    });

    res.json(newQuiz);
  }

  async function findQuizById(req, res) {
    const quizId = req.params.quizId;
    const quiz = await findQuizOrSend404(res, quizId);
    if (!quiz) {
      return;
    }

    const currentUser = await requireCourseAccess(req, res, quiz.course);
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "FACULTY" && !quiz.published) {
      res.status(403).json({ message: "Quiz is not published" });
      return;
    }

    let lastAttempt = null;
    if (currentUser.role === "STUDENT") {
      lastAttempt = await attemptsDao.findLatestAttemptForQuizAndUser(
        quiz._id,
        currentUser._id
      );
    }

    const includeAnswers = currentUser.role !== "STUDENT";
    const summary = buildQuizSummary(quiz, lastAttempt, includeAnswers);

    if (currentUser.role === "STUDENT") {
      summary.questions = getQuestions(quiz).map(sanitizeQuestionForStudents);
    }

    res.json(summary);
  }

  async function updateQuiz(req, res) {
    const quizId = req.params.quizId;
    const existingQuiz = await findQuizOrSend404(res, quizId);
    if (!existingQuiz) {
      return;
    }

    const currentUser = await requireFacultyForCourse(req, res, existingQuiz.course);
    if (!currentUser) {
      return;
    }

    await quizzesDao.updateQuiz(quizId, {
      ...req.body,
      course: existingQuiz.course,
    });

    const updatedQuiz = await quizzesDao.findQuizById(quizId);
    res.json(updatedQuiz);
  }

  async function deleteQuiz(req, res) {
    const quizId = req.params.quizId;
    const existingQuiz = await findQuizOrSend404(res, quizId);
    if (!existingQuiz) {
      return;
    }

    const currentUser = await requireFacultyForCourse(req, res, existingQuiz.course);
    if (!currentUser) {
      return;
    }

    await attemptsDao.deleteAttemptsForQuiz(quizId);
    await quizzesDao.deleteQuiz(quizId);
    res.sendStatus(204);
  }

  async function publishQuiz(req, res) {
    const quizId = req.params.quizId;
    const existingQuiz = await findQuizOrSend404(res, quizId);
    if (!existingQuiz) {
      return;
    }

    const currentUser = await requireFacultyForCourse(req, res, existingQuiz.course);
    if (!currentUser) {
      return;
    }

    await quizzesDao.updateQuiz(quizId, {
      ...existingQuiz.toObject(),
      published: !existingQuiz.published,
    });

    const updatedQuiz = await quizzesDao.findQuizById(quizId);
    res.json(updatedQuiz);
  }

  async function previewQuiz(req, res) {
    const quizId = req.params.quizId;
    const quiz = await findQuizOrSend404(res, quizId);
    if (!quiz) {
      return;
    }

    const currentUser = await requireFacultyForCourse(req, res, quiz.course);
    if (!currentUser) {
      return;
    }

    const evaluation = evaluateQuiz(quiz, req.body.answers);
    res.json({
      quizId,
      score: evaluation.score,
      totalPoints: evaluation.totalPoints,
      results: evaluation.results,
    });
  }

  async function findAttemptsForCurrentUser(req, res) {
    const quizId = req.params.quizId;
    const quiz = await findQuizOrSend404(res, quizId);
    if (!quiz) {
      return;
    }

    const currentUser = await requireCourseAccess(req, res, quiz.course);
    if (!currentUser) {
      return;
    }

    const attempts = await attemptsDao.findAttemptsForQuizAndUser(
      quizId,
      currentUser._id
    );

    res.json(attempts);
  }

  async function submitQuizAttempt(req, res) {
    const quizId = req.params.quizId;
    const quiz = await findQuizOrSend404(res, quizId);
    if (!quiz) {
      return;
    }

    const currentUser = await requireCourseAccess(req, res, quiz.course);
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "STUDENT") {
      res.status(403).json({ message: "Only students can submit attempts" });
      return;
    }

    if (!quiz.published) {
      res.status(403).json({ message: "Quiz is not published" });
      return;
    }

    const availability = getAvailabilityStatus(quiz);
    if (availability.status !== "AVAILABLE") {
      res.status(403).json({ message: `Quiz is ${availability.label.toLowerCase()}` });
      return;
    }

    const accessCode = req.body.accessCode || "";
    if (quiz.accessCode && quiz.accessCode !== accessCode) {
      res.status(403).json({ message: "Invalid access code" });
      return;
    }

    const priorAttempts = await attemptsDao.findAttemptsForQuizAndUser(
      quizId,
      currentUser._id
    );
    const attemptLimit = quiz.multipleAttempts ? quiz.howManyAttempts : 1;

    if (priorAttempts.length >= attemptLimit) {
      res.status(403).json({ message: "No attempts remaining" });
      return;
    }

    const answers = getAnswers(req.body.answers);
    const evaluation = evaluateQuiz(quiz, answers);
    const attempt = await attemptsDao.createAttempt({
      _id: uuidv4(),
      quiz: quizId,
      course: quiz.course,
      user: currentUser._id,
      attemptNumber: priorAttempts.length + 1,
      answers,
      results: evaluation.results,
      score: evaluation.score,
      totalPoints: evaluation.totalPoints,
      submittedAt: new Date(),
    });

    res.json(attempt);
  }

  app.get("/api/courses/:courseId/quizzes", findQuizzesForCourse);
  app.post("/api/courses/:courseId/quizzes", createQuizForCourse);
  app.get("/api/quizzes/:quizId", findQuizById);
  app.put("/api/quizzes/:quizId", updateQuiz);
  app.delete("/api/quizzes/:quizId", deleteQuiz);
  app.post("/api/quizzes/:quizId/publish", publishQuiz);
  app.post("/api/quizzes/:quizId/preview", previewQuiz);
  app.get("/api/quizzes/:quizId/attempts", findAttemptsForCurrentUser);
  app.post("/api/quizzes/:quizId/attempts", submitQuizAttempt);
}
