import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function AssignmentsDao() {
  const findAssignmentsForCourse = (courseId) =>
    model.find({ course: courseId });

  const findAssignmentById = (assignmentId) => model.findById(assignmentId);

  const createAssignment = (assignment) =>
    model.create({ ...assignment, _id: uuidv4() });

  const updateAssignment = async (assignmentId, assignmentUpdates) => {
    const result = await model.updateOne(
      { _id: assignmentId },
      { $set: assignmentUpdates }
    );
    return result.modifiedCount > 0 || result.nModified > 0;
  };

  const deleteAssignment = (assignmentId) =>
    model.deleteOne({ _id: assignmentId });

  return {
    findAssignmentsForCourse,
    findAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}