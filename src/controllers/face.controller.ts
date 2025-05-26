import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { getDescriptorFromBuffer } from "../utils/face.utils";
import uploader from "../utils/uploader";

interface AuthenticatedRequest extends Request {
  user?: {
    _id?: string;
    id?: string;
  };
  file?: Express.Multer.File;
}

export const registerFace = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - User not found in request" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No face image uploaded" });
    }

    const userId = req.user._id || req.user.id;
    const user = await UserModel.findById(userId).select('_id'); // hanya ambil ID agar aman

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const descriptor = await getDescriptorFromBuffer(req.file.buffer);

    // ✅ Upload ke Cloudinary
    const { buffer, mimetype } = req.file;
    const uploadResult = await uploader.uploadSingle({ buffer, mimetype });

    // ✅ Update tanpa mengganggu password
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          descriptor: Array.from(descriptor),
          faceImageUrl: uploadResult.secure_url
        }
      }
    );

    // ✅ Response
    res.json({
      success: true,
      message: "Face registered successfully",
      faceImageUrl: uploadResult.secure_url,
      descriptor: Array.from(descriptor)
    });

  } catch (error) {
    console.error("[Register Face] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
