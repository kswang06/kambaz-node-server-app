import CourseModel from "./courses/model.js";
import AssignmentModel from "./assignments/model.js";
import EnrollmentModel from "./enrollments/model.js";
import UserModel from "./users/model.js";
import db from "./database/index.js";

function buildSeedCourses() {
  return db.courses.map((course) => ({
    ...course,
    createdBy: course.createdBy || "123",
    modules: db.modules
      .filter((module) => module.course === course._id)
      .map(({ course: _course, ...module }) => module),
  }));
}

function buildSeedEnrollments(courses) {
  const studentIds = ["234", "456", "567", "890"];
  const enrollments = [];

  for (const course of courses) {
    if (course.createdBy) {
      enrollments.push({
        _id: `${course.createdBy}-${course._id}`,
        user: course.createdBy,
        course: course._id,
      });
    }

    for (const studentId of studentIds.slice(0, 2)) {
      enrollments.push({
        _id: `${studentId}-${course._id}`,
        user: studentId,
        course: course._id,
      });
    }
  }

  return enrollments;
}

export default async function seedDatabase() {
  const [courseCount, assignmentCount, userCount] = await Promise.all([
    CourseModel.countDocuments(),
    AssignmentModel.countDocuments(),
    UserModel.countDocuments(),
  ]);

  const seedTasks = [];

  if (courseCount === 0) {
    seedTasks.push(CourseModel.insertMany(buildSeedCourses()));
  }

  if (assignmentCount === 0) {
    seedTasks.push(AssignmentModel.insertMany(db.assignments));
  }

  if (userCount === 0) {
    seedTasks.push(UserModel.insertMany(db.users));
  }

  await Promise.all(seedTasks);

  const courses = await CourseModel.find({}, { _id: 1, createdBy: 1 }).lean();
  const validCourseIds = courses.map((course) => course._id);
  const enrollmentCount = await EnrollmentModel.countDocuments({
    course: { $in: validCourseIds },
  });

  if (validCourseIds.length > 0 && enrollmentCount === 0) {
    await EnrollmentModel.insertMany(buildSeedEnrollments(courses), {
      ordered: false,
    });
  }
}
