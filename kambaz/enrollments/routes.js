import EnrollmentsDao from "./dao.js";

export default function EnrollmentsRoutes(app, db) {
  const dao = EnrollmentsDao(db);

  const enrollUserInCourse = (req, res) => {
    const currentUser = req.session["currentUser"];
    const { courseId } = req.params;
    const enrollment = dao.enrollUserInCourse(currentUser._id, courseId);
    res.json(enrollment);
  };

  const unenrollUserFromCourse = (req, res) => {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { courseId } = req.params;
    dao.unenrollUserFromCourse(currentUser._id, courseId);
    res.sendStatus(204);
  };


  const findEnrollmentsForCurrentUser = (req, res) => {
    const currentUser = req.session["currentUser"];
    const enrollments = dao.findEnrollmentsForUser(currentUser._id);
    res.json(enrollments);
  };

  app.get("/api/users/current/enrollments", findEnrollmentsForCurrentUser);
  app.post("/api/users/current/courses/:courseId/enrollment", enrollUserInCourse);
  app.delete("/api/users/current/courses/:courseId/enrollment", unenrollUserFromCourse);
}