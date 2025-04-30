import { Result } from './../../node_modules/arg/index.d';
import { Request, Response } from 'express';
import * as Yup from 'yup';
import UserModel from '../models/user.model';
import { encrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { IReqUser } from '../utils/interfaces';


type TRegister = {
    fullName: string;
    username: string;
    password: string;
    confirmPassword: string;
};

type TLogin = {
    identifier: string;
    password: string;
};

const registerValidateSchema = Yup.object({
    fullName: Yup.string().required(),
    username: Yup.string().required(),
    password: Yup.string().required().min(6, 'Password must be at least 6 characters long')
        .test("at-least-one-uppercase-letter", "Contains at least one uppercase letter", (value) => {
            if (!value) return false;
            const regex = /^(?=.*[A-Z])/;
            return regex.test(value);
        })
        .test("at-least-one-number", "Contains at least one number", (value) => {
            if (!value) return false;
            const regex = /^(?=.*\d)/;
            return regex.test(value);
        }),
    confirmPassword: Yup.string().required().oneOf([Yup.ref('password'), ""], 'Passwords must match'),
});

export default {
    async register(req: Request, res: Response) {
        /**
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
        required: true,
        schema:{$ref: "#/components/schemas/RegisterRequest"},
        }
        */
        const {
            fullName,
            username,
            password,
            confirmPassword,
        } = req.body as unknown as TRegister;

        try {
            await registerValidateSchema.validate({
                fullName,
                username,
                password,
                confirmPassword,
            });

            const result = await UserModel.create({
                fullName,
                username,
                password
            })

            res.status(200).json({
                message: "User registered successfully",
                data: result,
            })
        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            })
        }
    },

    async login(req: Request, res: Response) {
        /**
        #swagger.tags = ['Auth']
        #swagger.requestBody = {
        required: true,
        schema:{$ref: "#/components/schemas/LoginRequest"},
        }
        */

        const {
            identifier,
            password,
        } = req.body as unknown as TLogin;
        try {
            const userByIdentifier = await UserModel.findOne({
                $or: [
                    {
                        username: identifier,
                    },
                ],
                isActive: true,
            });

            if (!userByIdentifier) {
                return res.status(403).json({
                    message: "User not found",
                    data: null,
                })
            };
            const validatePassword: boolean = encrypt(password) === userByIdentifier.password;
            if (!validatePassword) {
                return res.status(403).json({
                    message: "Invalid password",
                    data: null,
                })
            };

            const token = generateToken({
                id: userByIdentifier._id,
                role: userByIdentifier.role,
            });

            res.status(200).json({
                message: "User logged in successfully",
                data: token,
            });

        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            })
        }
    },

    async me(req: IReqUser, res: Response) {
        /**
        #swagger.tags = ['Auth']
        #swagger.security = [{ 
        "bearerAuth": [] 
        }]
        */

        try {
            const user = req.user;
            const result = await UserModel.findById(user?.id);

            res.status(200).json({
                message: "User found successfully",
                data: result,
            })

        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            })
        }
    },

    
};