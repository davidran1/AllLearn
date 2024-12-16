require("dotenv").config();
import { Request ,Response ,NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken"
import { redis } from "../utils/redis";

//authenticate user
export const isAuthenticated = CatchAsyncError(async(req:Request , res:Response , next:NextFunction)=>{
    const accessToken = req.cookies.access_token;
    console.log(req);
    if(!accessToken)
        return next(new ErrorHandler('משתמש לא מאומת',400));

    const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN as string)as JwtPayload;
    if(!decoded){
        return next(new ErrorHandler('Access token is not valid',400));
    }

    const user = await redis.get(decoded.id);

    if(!user)
        return next(new ErrorHandler('משתמש לא נמצא',400));
    req.user = JSON.parse(user);
    next();

})