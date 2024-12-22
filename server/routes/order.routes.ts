import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { create } from "domain";
import { createOrder, getAllOrders } from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order",isAuthenticated,createOrder);
orderRouter.get("/all-orders",isAuthenticated,authorizeRoles("admin"),getAllOrders);

export default orderRouter;