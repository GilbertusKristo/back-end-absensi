import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { getDescriptorFromBuffer } from "../utils/face.utils";

interface AuthenticatedRequest extends Request {
  user?: {
    _id?: string;
    id?: string;  // Support both _id and id
  };
  file?: Express.Multer.File;
}

export const registerFace = async (req: AuthenticatedRequest, res: Response) => {
  console.log("[Register Face] Decoded User:", req.user);

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - User not found in request" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const descriptor = await getDescriptorFromBuffer(req.file.buffer);

    // Support both id and _id from token
    const userId = req.user._id || req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID not provided in token" });
    }

    const user = await UserModel.findById(userId);
    console.log("[Register Face] Fetched User from DB:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Only update descriptor without risking other data loss
    await UserModel.updateOne(
      { _id: userId },
      { $set: { descriptor: Array.from(descriptor) } }
    );

    res.json({
      success: true,
      message: "Face registered successfully",
      descriptor: Array.from(descriptor)
    });

  } catch (error) {
    console.error("[Register Face] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
