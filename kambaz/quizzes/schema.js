import mongoose from "mongoose";

const quizChoiceSchema = new mongoose.Schema(
  {
    _id: String,
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    _id: String,
    type: {
      type: String,
      enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK"],
      default: "MULTIPLE_CHOICE",
    },
    title: { type: String, default: "New Question" },
    points: { type: Number, default: 0 },
    question: { type: String, default: "" },
    choices: { type: [quizChoiceSchema], default: [] },
    trueFalseAnswer: { type: Boolean, default: true },
    blankAnswers: { type: [String], default: [] },
    caseSensitive: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    _id: String,
    course: { type: String, required: true, index: true },
    title: { type: String, default: "New Quiz" },
    description: { type: String, default: "" },
    quizType: {
      type: String,
      enum: [
        "GRADED_QUIZ",
        "PRACTICE_QUIZ",
        "GRADED_SURVEY",
        "UNGRADED_SURVEY",
      ],
      default: "GRADED_QUIZ",
    },
    assignmentGroup: {
      type: String,
      enum: ["QUIZZES", "EXAMS", "ASSIGNMENTS", "PROJECT"],
      default: "QUIZZES",
    },
    shuffleAnswers: { type: Boolean, default: true },
    timeLimit: { type: Number, default: 20 },
    multipleAttempts: { type: Boolean, default: false },
    howManyAttempts: { type: Number, default: 1 },
    showCorrectAnswers: { type: String, default: "IMMEDIATELY" },
    accessCode: { type: String, default: "" },
    oneQuestionAtATime: { type: Boolean, default: true },
    webcamRequired: { type: Boolean, default: false },
    lockQuestionsAfterAnswering: { type: Boolean, default: false },
    dueDate: String,
    availableDate: String,
    untilDate: String,
    published: { type: Boolean, default: false },
    questions: { type: [quizQuestionSchema], default: [] },
  },
  { collection: "quizzes", timestamps: true }
);

export default quizSchema;
