require("dotenv").config();
import { Request ,Response ,NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken"
import { redis } from "../utils/redis";

//authenticate user
export const isAuthenticated = CatchAsyncError(async(req:Request , res:Response , next:NextFunction)=>{
    const accessToken = req.cookies.access_token;

    if(!accessToken)
        return next(new ErrorHandler('משתמש לא מאומת',400));

    const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN as string)as JwtPayload;
    if(!decoded){
        return next(new ErrorHandler('Access token is not valid',400));
    }

    const user = await redis.get(decoded.id);

    if(!user)
        return next(new ErrorHandler("כדי לגשת לאיזור הנוכחי , עליך להתחבר",400));
    req.user = JSON.parse(user);
    next();

});

//validate user role

export const authorizeRoles =(...roles:string[])=> {
    return (req:Request , res:Response , next:NextFunction)=>{
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler('אין לך גישה מתאימה לדף הנוכחי' , 403));
        }
        next();
    }
}