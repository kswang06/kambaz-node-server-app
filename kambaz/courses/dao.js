import { v4 as uuidv4 } from "uuid";
import model from "./model.js";
import EnrollmentsDao from "../enrollments/dao.js";

export default function CoursesDao() {
  const enrollmentsDao = EnrollmentsDao();

  function findAllCourses() {
    return model.find();
  }

  async function findCoursesForEnrolledUser(userId) {
    return enrollmentsDao.findEnrollmentsForUser(userId);
  }

  function findCourseById(courseId) {
    return model.findById(courseId);
  }

  function createCourse(course) {
    return model.create({ ...course, _id: course._id || uuidv4() });
  }

  function deleteCourse(courseId) {
    return model.deleteOne({ _id: courseId });
  }

  function updateCourse(courseId, courseUpdates) {
    return model.updateOne({ _id: courseId }, { $set: courseUpdates });
  }

  return {
    findAllCourses,
    findCoursesForEnrolledUser,
    findCourseById,
    createCourse,
    deleteCourse,
    updateCourse,
  };
}
