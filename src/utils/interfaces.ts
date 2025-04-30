import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Request } from "express";



export interface IUserToken extends Omit<

    User,
    | "password"
    | "isActive"
    | "fullName"
    | "profilePicture"
    | "username"
> {
    id?: Types.ObjectId;
}

export interface IReqUser extends Request {
    user?: IUserToken;
}