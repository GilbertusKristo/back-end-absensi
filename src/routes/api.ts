import express, { Request, Response } from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';

const Router = express.Router();

Router.post("/auth/register", authController.register);
Router.post("/auth/login", authController.login);
Router.get("/auth/me", authMiddleware, authController.me);


export default Router;