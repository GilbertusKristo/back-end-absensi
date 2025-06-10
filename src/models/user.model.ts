import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";
import { ROLES } from "../utils/constant";
import * as Yup from "yup";
export interface User {
    fullName: string;
    username: string;
    password: string;
    role: string;
    profilePicture: string;
    isActive: boolean;
    descriptor?: number[];
    faceImageUrl?: string;
    createdAt?: string;
}
const validatePassword = Yup.string()
    .required()
    .min(6, "Password must be at least 6 characters")
    .test(
        "at-least-one-uppercase-letter",
        "Contains at least one uppercase letter",
        (value) => {
            if (!value) return false;
            const regex = /^(?=.*[A-Z])/;
            return regex.test(value);
        }
    )
    .test(
        "at-least-one-number",
        "Contains at least one uppercase letter",
        (value) => {
            if (!value) return false;
            const regex = /^(?=.*\d)/;
            return regex.test(value);
        }
    );
const validateConfirmPassword = Yup.string()
    .required()
    .oneOf([Yup.ref("password"), ""], "Password not match");

export const USER_MODEL_NAME = "User";

export const userLoginDTO = Yup.object({
    identifier: Yup.string().required(),
    password: validatePassword,
});

export const userUpdatePasswordDTO = Yup.object({
    oldPassword: validatePassword,
    password: validatePassword,
    confirmPassword: validateConfirmPassword,
});


const Schema = mongoose.Schema;

const UserSchema = new Schema<User>({
    fullName: {
        type: Schema.Types.String,
        required: true,
    },
    username: {
        type: Schema.Types.String,
        required: true,
        unique: true,
    },
    password: {
        type: Schema.Types.String,
        required: true,
    },
    role: {
        type: Schema.Types.String,
        enum: [ROLES.ADMIN, ROLES.USER],
        default: ROLES.USER,
    },
    profilePicture: {
        type: Schema.Types.String,
        default: "user.jpg",
    },
    isActive: {
        type: Schema.Types.Boolean,
        default: true,
    },
    descriptor: {
        type: [Number], // ← Simpan array descriptor hasil face-api.js
        default: undefined,
    }
},
    {
        timestamps: true,
    });

UserSchema.pre("save", function (next) {
    const user = this;
    user.password = encrypt(user.password);
    next();
});

UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;

    // Format createdAt ke WIB (Asia/Jakarta)
    if (user.createdAt) {
        user.createdAt = new Date(user.createdAt).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
        });
    }

    // Format updatedAt ke WIB (opsional, jika kamu pakai)
    if (user.updatedAt) {
        user.updatedAt = new Date(user.updatedAt).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
        });
    }

    return user;
};


const UserModel = mongoose.model("User", UserSchema);
export default UserModel;