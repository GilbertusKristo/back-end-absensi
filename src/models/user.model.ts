import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";
import { ROLES } from "../utils/constant";

export interface User {
    fullName: string;
    username: string;
    password: string;
    role: string;
    profilePicture: string;
    isActive: boolean;
    descriptor?: number[]; // ← Tambahan untuk Face Recognition
    createdAt?: string;
}

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