import { v4 as uuidv4 } from "uuid";
import model from "./model.js";

export default function EnrollmentsDao(db) {
  async function findEnrollmentsForUser(userId) {
    const enrollments = await model.find({ user: userId }).populate("course");
    return enrollments.map((enrollment) => enrollment.course);
  }

  async function findEnrollmentsForCourse(courseId) {
    const enrollments = await model.find({ course: courseId }).populate("user");
    return enrollments.map((enrollment) => enrollment.user);
  }

  function enrollUserInCourse(userId, courseId) {
    return model.create({
     user: userId,
     course: courseId,
     _id: `${userId}-${courseId}`,
   });

  }

  function unenrollUserFromCourse(userId, courseId) {
    return model.deleteOne({ user: userId, course: courseId });
  }

  function unenrollAllUsersFromCourse(courseId) {
    return model.deleteMany({ course: courseId });
  }


  return {
    findEnrollmentsForUser,
    findEnrollmentsForCourse,
    enrollUserInCourse,
    unenrollUserFromCourse,
    unenrollAllUsersFromCourse,
  };
}