import { SECRET } from "./env"
import crypto from "crypto";

export const encrypt = (password: string): string => {
    const encrypted = crypto
    .pbkdf2Sync(password, SECRET, 1000, 64, "sha512")
    .toString("hex");
    return encrypted;
}