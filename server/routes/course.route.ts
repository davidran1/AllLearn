import express from "express";
import { addAnswer, addQuestion, deleteCourse, editCourse, getAllCourses, getAllCoursesAdmin, getCourseByUser, getSingleCourse, uploadCourse } from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const courseRouter = express.Router();

courseRouter.post("/create-course",isAuthenticated,authorizeRoles("admin"), uploadCourse);
courseRouter.put("/edit-course/:id",isAuthenticated,authorizeRoles("admin"), editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses ", getAllCourses);
courseRouter.get("/get-course-content/:id",isAuthenticated, getCourseByUser);
courseRouter.put("/add-question",isAuthenticated,addQuestion);
courseRouter.put("/add-answer",isAuthenticated,addAnswer);
courseRouter.get("/all-courses",isAuthenticated,authorizeRoles("admin"), getAllCoursesAdmin);
courseRouter.delete("/delete-course/:id",isAuthenticated,authorizeRoles("admin"), deleteCourse);
export default courseRouter;