import { NextFunction ,Request , Response} from "express"
import ErrorHandler from "../utils/ErrorHandler"

export const ErrorMiddleWare = (err:any , req:Request , res:Response , next:NextFunction) => {
    err.statusCode = err.statusCode ||500;
    err.message = err.message || 'Internal server error';

    //wrong mongodb id error
    if(err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message , 400);
    }
     
    //duplicate key error
    if(err.code === 11000) {
        const message = `duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message , 400);
    }

    //wrong jwt error
    if(err.name === 'JsonWebTokenError') {
        const message = 'Json web token is invalid , try again';
        err = new ErrorHandler(message , 400);
    }

    //JWT EXPIRED
    if(err.name === 'TokenExpiredError') {
        const message = `json web token is expired , try again`;
        err = new ErrorHandler(message , 400);
    }

    res.status(err.statusCode).json({
        success: false , 
        message: err.message,
    });

};