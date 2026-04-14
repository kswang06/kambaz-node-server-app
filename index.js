import express from 'express'
import mongoose from "mongoose";
import Hello from "./Hello.js"
import Lab5 from "./Lab5/index.js";
import cors from "cors";
import db from "./kambaz/database/index.js";
import UserRoutes from "./kambaz/users/routes.js";
import CourseRoutes from "./kambaz/courses/routes.js";
import "dotenv/config";
import session from "express-session";
import MongoStore from "connect-mongo";
import ModulesRoutes from "./kambaz/modules/routes.js";
import AssignmentRoutes from "./kambaz/assignments/routes.js";
import EnrollmentsRoutes from "./kambaz/enrollments/routes.js";
import QuizzesRoutes from "./kambaz/quizzes/routes.js";

const CONNECTION_STRING =
  process.env.DATABASE_CONNECTION_STRING || "mongodb://127.0.0.1:27017/kambaz";
mongoose.connect(CONNECTION_STRING);

const app = express();
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.SERVER_ENV === "production";

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === "http://localhost:3000" ||
        origin === process.env.CLIENT_URL ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: CONNECTION_STRING,
    collectionName: "sessions",
  }),
};

if (isProduction) {
  app.set("trust proxy", 1);
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    sameSite: "none",
    secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

app.use(session(sessionOptions));
app.use(express.json());

UserRoutes(app, db);
CourseRoutes(app, db);
ModulesRoutes(app, db);
AssignmentRoutes(app, db);
EnrollmentsRoutes(app);
QuizzesRoutes(app);
Lab5(app);
Hello(app);

app.listen(process.env.PORT || 4000);
