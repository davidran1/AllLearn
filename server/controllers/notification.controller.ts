import NotificationModel from "../models/notification.model";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cron from "node-cron";


//get all notifications- admin
export const getNotifications = CatchAsyncError(async(req:Request,res:Response ,next:NextFunction)=>{
    try{
        const notifications = await NotificationModel.find().sort({createdAt:-1});
        res.status(201).json({   
            success:true,
            notifications,
        });   
   }catch(error:any) {
    return next(new ErrorHandler(error.message,500));
   }
})


//update notification- admin
export const updateNotification = CatchAsyncError(async(req:Request,res:Response ,next:NextFunction)=>{
    try{
        const notification = await NotificationModel.findById(req.params.id);
        if(!notification){
            return next(new ErrorHandler("Notification not found",404));
        }
        notification.status === 'read'? notification.status = 'unread': notification.status = 'read';
        await notification.save();
        const notifications = await NotificationModel.find().sort({createdAt:-1});
        res.status(201).json({   
            success:true,
            notifications,
        });   
   }catch(error:any) {
    return next(new ErrorHandler(error.message,500));
   }
})

//delete notification- admin
cron.schedule("0 0 0 * * * ",async()=>{
    const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000);
    await NotificationModel.deleteMany({status:"read",createdAt:{$lt:thirtyDaysAgo}});
    
})


/*
export const uploadCourse = CatchAsyncError(async(req:Request,res:Response ,next:NextFunction)=>{
    try{

   }catch(error:any) {
    return next(new ErrorHandler(error.message,500));
   }
})
*/
