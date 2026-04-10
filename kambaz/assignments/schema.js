import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    _id: String,
    course: { type: String, required: true },
    title: String,
    description: String,
    points: Number,
    dueDate: String,
    availableDate: String,
    untilDate: String,
    group: String,
    displayType: String,
    submissionType: String,
    assignedTo: String,
  },
  { collection: "assignments" }
);

export default assignmentSchema;
