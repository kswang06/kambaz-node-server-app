import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function AssignmentsDao() {
  const findAssignmentsForCourse = (courseId) =>
    model.find({ course: courseId });

  const findAssignmentById = (assignmentId) => model.findById(assignmentId);

  const createAssignment = (assignment) =>
    model.create({ ...assignment, _id: uuidv4() });

  const updateAssignment = async (assignmentId, assignmentUpdates) => {
    const updatedAssignment = await model.findByIdAndUpdate(
      assignmentId,
      { $set: assignmentUpdates },
      { new: true }
    );
    return updatedAssignment;
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
