import { v4 as uuidv4 } from "uuid";

export default function AssignmentsDao(db) {
  function findAssignmentsForCourse(courseId) {
    const { assignments } = db;
    return assignments.filter((assignment) => assignment.course === courseId);
  }

  function findAssignmentById(assignmentId) {
    const { assignments } = db;
    return assignments.find((assignment) => assignment._id === assignmentId);
  }

  function createAssignment(assignment) {
    const newAssignment = { ...assignment, _id: uuidv4() };
    db.assignments = [...db.assignments, newAssignment];
    return newAssignment;
  }

  function updateAssignment(assignmentId, assignmentUpdates) {
    const { assignments } = db;
    const assignment = assignments.find(
      (assignment) => assignment._id === assignmentId
    );
    if (!assignment) return null;
    Object.assign(assignment, assignmentUpdates);
    return assignment;
  }

  function deleteAssignment(assignmentId) {
    const { assignments } = db;
    db.assignments = assignments.filter(
      (assignment) => assignment._id !== assignmentId
    );
  }

  return {
    findAssignmentsForCourse,
    findAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}