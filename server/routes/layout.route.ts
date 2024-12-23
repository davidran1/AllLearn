import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayoutByType } from "../controllers/layout.controller";
import exp from "constants";
import { get } from "http";

const layoutRouter = express.Router();

layoutRouter.post("/create-layout", isAuthenticated,authorizeRoles("admin"), createLayout);
layoutRouter.put("/edit-layout", isAuthenticated,authorizeRoles("admin"), editLayout);
layoutRouter.post("/get-layout", isAuthenticated, getLayoutByType);

export default layoutRouter;