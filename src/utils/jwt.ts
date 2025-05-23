import { Types } from "mongoose";
import { User } from "../models/user.model";
import { SECRET } from "./env";
import jwt from "jsonwebtoken";
import { IUserToken } from "./interfaces";


export const generateToken = (user: IUserToken): string => {
    const token = jwt.sign(user, SECRET, {
        expiresIn: "5h",
    });
    return token;
};

export const getUserData = (token: string) => {
    const user = jwt.verify(token, SECRET) as IUserToken;
    return user;
};
