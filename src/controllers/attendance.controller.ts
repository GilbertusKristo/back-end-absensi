import { Request, Response } from "express";
import UserModel from "../models/user.model";
import AttendanceModel from "../models/attendance.model";
import { calculateDistance, getDescriptorFromBuffer } from "../utils/face.utils";
import mongoose from "mongoose";

interface AuthenticatedRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

/**
 * Check-In Function
 */
export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized - User not found in request" });
  if (!req.file) return res.status(400).json({ message: "No face image uploaded" });

  const userId = req.user.id;
  const user = await UserModel.findById(userId)
    .select('_id fullName username descriptor')
    .lean();

  if (!user || !user.descriptor) return res.status(404).json({ message: "User not registered for face recognition" });

  const currentDescriptor = await getDescriptorFromBuffer(req.file.buffer);
  const distance = calculateDistance(currentDescriptor, user.descriptor);

  if (distance > 0.5) return res.status(400).json({ message: "Face does not match" });

  const timestamp = new Date();
  await AttendanceModel.create({ userId, type: "check-in", timestamp });

  res.json({
    success: true,
    message: "Check-in successful",
    user: {
      _id: user._id,
      fullName: user.fullName,
      username: user.username
    },
    timestamp: timestamp.toISOString()
  });
};

/**
 * Check-Out Function
 */
export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized - User not found in request" });
  if (!req.file) return res.status(400).json({ message: "No face image uploaded" });

  const userId = req.user.id;
  const user = await UserModel.findById(userId)
    .select('_id fullName username descriptor')
    .lean();

  if (!user || !user.descriptor) return res.status(404).json({ message: "User not registered for face recognition" });

  const currentDescriptor = await getDescriptorFromBuffer(req.file.buffer);
  const distance = calculateDistance(currentDescriptor, user.descriptor);

  if (distance > 0.5) return res.status(400).json({ message: "Face does not match" });

  const timestamp = new Date();
  await AttendanceModel.create({ userId, type: "check-out", timestamp });

  res.json({
    success: true,
    message: "Check-out successful",
    user: {
      _id: user._id,
      fullName: user.fullName,
      username: user.username
    },
    timestamp: timestamp.toISOString()
  });
};

/**
 * Get User Attendance History
 */
export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized - User not found in request" });

  const userId = new mongoose.Types.ObjectId(req.user.id);
  const records = await AttendanceModel.find({ userId }).sort({ timestamp: -1 });

  res.json({
    success: true,
    message: `History for user ${req.user.id}`,
    data: records
  });
};

/**
 * Get All Attendance Report
 */
export const getReport = async (_req: Request, res: Response) => {
  const records = await AttendanceModel.find()
    .populate("userId", "fullName username")  // ✅ Perbaiki agar sesuai schema
    .sort({ timestamp: -1 });

  res.json({
    success: true,
    message: "All users attendance report",
    data: records
  });
};
