import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answer: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const attemptResultSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    correct: { type: Boolean, required: true },
    earnedPoints: { type: Number, default: 0 },
    submittedAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    _id: String,
    quiz: { type: String, required: true, index: true },
    course: { type: String, required: true, index: true },
    user: { type: String, required: true, index: true },
    attemptNumber: { type: Number, required: true },
    answers: { type: [attemptAnswerSchema], default: [] },
    results: { type: [attemptResultSchema], default: [] },
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { collection: "quizAttempts", timestamps: true }
);

export default quizAttemptSchema;
