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

//register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email }); //check if the email already exist
      if (isEmailExist) {
        return next(new ErrorHandler("מייל כבר קיים במערכת!", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "הפעל את החשבון שלך",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `בדוק את הקוד שנשלח למייל ${user.email} כדי להפעיל את החשבון!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

//activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("קוד אימות לא תקין", 400));
      }

      const { name, email, password } = newUser.user;
      const existUser = await userModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("מייל כבר קיים במערכת!", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
        message: "נרשמת בהצלחה למערכת!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("אנא הזן מייל וסיסמא", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("מייל או סיסמא אינם נכונים", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("מייל או סיסמא אינם נכונים", 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      redis.del(req.user?._id as RedisKey); //delete from redis
      res.status(200).json({
        success: true,
        message: "התנתקת בהצלחה",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update access token

export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      if (!decoded) {
        return next(new ErrorHandler("Could not refresh token", 400));
      }

      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler("Could not refresh token", 400));
      }

      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "5m" }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: "3d" }
      );

      req.user=user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        status: "success",
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//get user info
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id as string;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}
//social auth
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//Update user information
interface IUpdateUserInfo{
  name?:string;
  email?:string;
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
     const {name , email} = req.body as IUpdateUserInfo;
     const userId = req.user?._id;
     const user = await userModel.findById(userId);
     if(email &&user){
      const isEmailExist = await userModel.findOne({email});
      if(isEmailExist)
        return next(new ErrorHandler("מייל כבר קיים במערכת", 400));
      user.email =email;
     }

     if(name &&user){
      user.name = name;
     }
     await user?.save();
     await redis.set(userId as RedisKey,JSON.stringify(user));

     res.status(201).json({
      success:true,
      user,
     })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


//Update user password
interface IUpdatePassword{
  newPassword?:string;
  oldPassword?:string;
}

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {oldPassword , newPassword} = req.body as IUpdatePassword;
      if(!oldPassword || !newPassword)
        return next(new ErrorHandler("אנא הזן סיסמא נוכחית וסיסמא חדשה", 400));
      const user = await userModel.findById(req.user?._id).select("+password");
      if(user?.password ===undefined){
        return next(new ErrorHandler("משתמש לא מזוהה", 400));
      }
      const isPasswordMatch = await user?.comparePassword(oldPassword as string);
      if(!isPasswordMatch){
        return next(new ErrorHandler("הסיסמא שהזנת שגויה", 400));
      }
      user.password=newPassword as string;
      await user.save();
      await redis.set(req.user?._id as RedisKey,JSON.stringify(user));
      res.status(201).json({
        success:true,
        user,
      })

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);




