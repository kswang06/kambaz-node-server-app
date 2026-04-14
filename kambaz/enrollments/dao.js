import model from "./model.js";

export default function EnrollmentsDao() {
  async function findEnrollment(userId, courseId) {
    return model.findOne({ user: userId, course: courseId });
  }

  async function findEnrollmentsForUser(userId) {
    const enrollments = await model.find({ user: userId }).populate("course");
    return enrollments.map((enrollment) => enrollment.course);
  }

  async function findEnrollmentsForCourse(courseId) {
    const enrollments = await model.find({ course: courseId }).populate("user");
    return enrollments.map((enrollment) => enrollment.user);
  }

  async function isUserEnrolledInCourse(userId, courseId) {
    const enrollment = await findEnrollment(userId, courseId);
    return Boolean(enrollment);
  }

  async function enrollUserInCourse(userId, courseId) {
    const existingEnrollment = await findEnrollment(userId, courseId);
    if (existingEnrollment) {
      return existingEnrollment;
    }

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
    findEnrollment,
    findEnrollmentsForUser,
    findEnrollmentsForCourse,
    isUserEnrolledInCourse,
    enrollUserInCourse,
    unenrollUserFromCourse,
    unenrollAllUsersFromCourse,
  };
}
