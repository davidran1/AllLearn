require("dotenv").config();
import express, { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  sendToken,
  refreshTokenOptions,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { RedisKey } from "ioredis";
import { getUserById } from "../services/user.service";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";

//upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get all courses without purchasing
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if(isCacheExist){
        const courses = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          courses,
        });
      }
      else{
        const courses = await CourseModel.find().select(
            "-courseData.videoUrl -courseData.questions -courseData.links"
          );
          await redis.set("allCourses",JSON.stringify(courses));//save the course to redis for next time coming(cache)
          res.status(200).json({
            success: true,
            courses,
          });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//Get single course without purchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      }
      else{
        const course = await CourseModel.findById(req.params.id).select(
            "-courseData.videoUrl -courseData.questions -courseData.links"
          );
          redis.set(courseId , JSON.stringify(course));//save the course to redis for next time coming(cache)
          res.status(200).json({
            success: true,
            course,
          });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get course content for valid user
export const getCourseByUser = CatchAsyncError(async(req:Request,res:Response ,next:NextFunction)=>{
    try{
        const userCourseList = req.user?.courses;
        const courseId= req.params.id;
        const coursExist = userCourseList?.find((course:any)=>course._id=== courseId);
        if(!coursExist){
            return next(new ErrorHandler("אין לך גישה לקורס אליו אתה מנסה לגשת",500));
        }
        const course = await CourseModel.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({
            success: true,
            content,
          });

   }catch(error:any) {
    return next(new ErrorHandler(error.message,500));
   }
})

/*
export const uploadCourse = CatchAsyncError(async(req:Request,res:Response ,next:NextFunction)=>{
    try{

   }catch(error:any) {
    return next(new ErrorHandler(error.message,500));
   }
})
*/
