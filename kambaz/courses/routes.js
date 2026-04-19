import CoursesDao from "./dao.js";
import EnrollmentsDao from "../enrollments/dao.js";
import QuizzesDao from "../quizzes/dao.js";
import QuizAttemptsDao from "../quiz-attempts/dao.js";
export default function CourseRoutes(app) {
  const dao = CoursesDao();
  const enrollmentsDao = EnrollmentsDao();
  const quizzesDao = QuizzesDao();
  const quizAttemptsDao = QuizAttemptsDao();

  const requireFacultyForCourse = async (req, res, courseId) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return null;
    }

    if (currentUser.role === "ADMIN") {
      return currentUser;
    }

    const course = await dao.findCourseById(courseId);
    if (!course) {
      res.sendStatus(404);
      return null;
    }

    const canManageCourse =
      currentUser.role === "FACULTY" &&
      (course.createdBy === currentUser._id ||
        (await enrollmentsDao.isUserEnrolledInCourse(currentUser._id, courseId)));

    if (!canManageCourse) {
      res.sendStatus(403);
      return null;
    }
    return currentUser;
  };

  const findAllCourses = async (req, res) => {
    const courses = await dao.findAllCourses();
    res.send(courses);
  };

  const createCourse = async (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    if (currentUser.role !== "FACULTY") {
      res.status(403).json({ message: "Only faculty can create courses" });
      return;
    }

    const course = await dao.createCourse({
      ...req.body,
      createdBy: currentUser._id,
    });
    await enrollmentsDao.enrollUserInCourse(currentUser._id, course._id);
    res.json(course);
  };

  const findCoursesForEnrolledUser = async (req, res) => {
    let { userId } = req.params;
    if (userId === "current") {
      const currentUser = req.session["currentUser"];
      if (!currentUser) {
        res.sendStatus(401);
        return;
      }
      userId = currentUser._id;
    }
    const courses = await enrollmentsDao.findEnrollmentsForUser(userId);
    res.json(courses);
  };

  const deleteCourse = async (req, res) => {
    const { courseId } = req.params;
    const currentUser = await requireFacultyForCourse(req, res, courseId);
    if (!currentUser) {
      return;
    }
    await quizAttemptsDao.deleteAttemptsForCourse(courseId);
    await quizzesDao.deleteQuizzesForCourse(courseId);
    await enrollmentsDao.unenrollAllUsersFromCourse(courseId);
    const status = await dao.deleteCourse(courseId);
    res.send(status);
  };

  const updateCourse = async (req, res) => {
    const { courseId } = req.params;
    const currentUser = await requireFacultyForCourse(req, res, courseId);
    if (!currentUser) {
      return;
    }
    const courseUpdates = req.body;
    const status = await dao.updateCourse(courseId, courseUpdates);
    res.send(status);
  };

  const findUsersForCourse = async (req, res) => {
    const { cid } = req.params;
    const users = await enrollmentsDao.findEnrollmentsForCourse(cid);
    res.json(users);
  };

  app.get("/api/courses/:cid/users", findUsersForCourse);
  app.put("/api/courses/:courseId", updateCourse);
  app.delete("/api/courses/:courseId", deleteCourse);
  app.post("/api/users/current/courses", createCourse);
  app.get("/api/users/:userId/courses", findCoursesForEnrolledUser);
  app.get("/api/courses", findAllCourses);
}
