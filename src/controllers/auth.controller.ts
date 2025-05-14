import { Result } from './../../node_modules/arg/index.d';
import { Request, Response } from 'express';
import * as Yup from 'yup';
import UserModel from '../models/user.model';
import { encrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { IReqUser } from '../utils/interfaces';
import uploader from '../utils/uploader';


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

    async getAllUsers(req: IReqUser, res: Response) {
        try {
            const user = req.user;

            // Cek apakah pengguna memiliki hak akses admin
            if (user?.role !== "admin") {
                return res.status(403).json({
                    message: "Akses ditolak. Hanya admin yang dapat melihat seluruh pengguna.",
                    data: null,
                });
            }

            const users = await UserModel.find({}, "-password").sort({ createdAt: -1 }); // tanpa password

            res.status(200).json({
                message: "Daftar semua pengguna berhasil diambil",
                data: users,
            });

        } catch (error) {
            const err = error as Error;
            res.status(500).json({
                message: err.message,
                data: null,
            });
        }
    },
    async updateProfilePicture(req: IReqUser, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Profile picture is required", data: null });
            }

            const { buffer, mimetype } = req.file;
            const uploadResult = await uploader.uploadSingle({ buffer, mimetype });

            const updatedUser = await UserModel.findByIdAndUpdate(
                req.user?.id,
                { profilePicture: uploadResult.secure_url },
                { new: true }
            );

            res.status(200).json({ message: "Profile picture updated successfully", data: updatedUser });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message, data: null });
        }
    },
    async updateProfileData(req: IReqUser, res: Response) {
        try {
            const { fullName, username, role, isActive } = req.body;

            const updatedUser = await UserModel.findByIdAndUpdate(
                req.user?.id,
                { $set: { fullName, username, role, isActive } },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found", data: null });
            }

            res.status(200).json({ message: "Profile data updated successfully", data: updatedUser });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message, data: null });
        }
    },
        /**
     * Get User by ID
     */
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await UserModel.findById(id).select('-password');
            if (!user) {
                return res.status(404).json({ message: "User not found", data: null });
            }

            res.status(200).json({
                message: "User retrieved successfully",
                data: user,
            });

        } catch (error) {
            const err = error as Error;
            res.status(500).json({ message: err.message, data: null });
        }
    },

    /**
     * Update User by ID
     */
    async updateUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { fullName, username, role, isActive } = req.body;

            const updatedUser = await UserModel.findByIdAndUpdate(
                id,
                { $set: { fullName, username, role, isActive } },
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found", data: null });
            }

            res.status(200).json({
                message: "User updated successfully",
                data: updatedUser,
            });

        } catch (error) {
            const err = error as Error;
            res.status(500).json({ message: err.message, data: null });
        }
    },
        /**
     * Update User's Profile Picture by ID (Admin Only)
     */
    async updateProfilePictureById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!req.file) {
                return res.status(400).json({ message: "Profile picture is required", data: null });
            }

            const { buffer, mimetype } = req.file;
            const uploadResult = await uploader.uploadSingle({ buffer, mimetype });

            const updatedUser = await UserModel.findByIdAndUpdate(
                id,
                { profilePicture: uploadResult.secure_url },
                { new: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: "User not found", data: null });
            }

            res.status(200).json({ message: "Profile picture updated successfully", data: updatedUser });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message, data: null });
        }
    },

        /**
     * Delete User by ID (Admin Only)
     */
    async deleteUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deletedUser = await UserModel.findByIdAndDelete(id);

            if (!deletedUser) {
                return res.status(404).json({ message: "User not found", data: null });
            }

            res.status(200).json({
                message: "User deleted successfully",
                data: {
                    _id: deletedUser._id,
                    fullName: deletedUser.fullName,
                    username: deletedUser.username
                }
            });
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ message: err.message, data: null });
        }
    },








};