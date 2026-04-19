import CourseModel from "./courses/model.js";
import AssignmentModel from "./assignments/model.js";
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
}
