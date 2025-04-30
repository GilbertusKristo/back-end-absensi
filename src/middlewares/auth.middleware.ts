import { IReqUser } from '../utils/interfaces';
import { User } from './../models/user.model';
import { getUserData } from './../utils/jwt';
import { NextFunction, Request, Response } from "express";




export default function authMiddleware(req: Request, res: Response, next:NextFunction) {
    const authorization = req.headers?.authorization;

    if (!authorization) {
        return res.status(403).json({
            message: "Unauthorized",
            data: null,
        });
    }

    const [prefix, Token] = authorization.split(" ");

    if(!(prefix === "Bearer" && Token)) {
        return res.status(403).json({
            message: "Unauthorized",
            data: null,
        });
    }

    const user = getUserData(Token) ;
    if (!user) {
        return res.status(403).json({
            message: "Unauthorized",
            data: null,
        });
    }

    (req as IReqUser).user = user;

    next();

};