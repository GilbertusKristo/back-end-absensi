import { Request, Response } from "express";
import UserModel from "../models/user.model";
import AttendanceModel from "../models/attendance.model";
import { calculateDistance, getDescriptorFromBuffer } from "../utils/face.utils";
import mongoose from "mongoose";
import ContactModel from "../models/contact.model";
import { formatWIB } from "../utils/date.utils";

interface AuthenticatedRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

const getRequestInfo = (req: Request) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  localTime: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
});

export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!req.file) return res.status(400).json({ message: "No face image uploaded" });
  const { latitude, longitude, locationName } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ message: "Location information is required" });

  const userId = req.user.id;
  const user = await UserModel.findById(userId).select('_id fullName username descriptor').lean();
  const contact = await ContactModel.findOne({ userId }).lean();
  if (!user || !user.descriptor || !contact) return res.status(404).json({ message: "Please fill in the contact form first" });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const alreadyCheckedIn = await AttendanceModel.findOne({ userId, type: "check-in", timestamp: { $gte: todayStart } });
  if (alreadyCheckedIn) return res.status(400).json({ message: "Already checked in today." });

  const descriptor = await getDescriptorFromBuffer(req.file.buffer);
  if (calculateDistance(descriptor, user.descriptor) > 0.5) return res.status(400).json({ message: "Face does not match" });

  const timestamp = new Date();
  const { date, time, full } = formatWIB(timestamp);

  const attendance = await AttendanceModel.create({
    userId,
    type: "check-in",
    timestamp,
    imageFileName: req.file.originalname || "unknown",
    location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude), name: locationName || "Unknown Location" }
  });

  res.json({
    success: true,
    message: "Check-in successful",
    timestampUTC: timestamp,
    timestampWIB: { date, time, full },
    user: { _id: user._id, fullName: user.fullName, username: user.username, contact },
    attendance
  });
};

// Check-out Handler
export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!req.file) return res.status(400).json({ message: "No face image uploaded" });
  const { latitude, longitude, locationName } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ message: "Location information is required" });

  const userId = req.user.id;
  const user = await UserModel.findById(userId).select('_id fullName username descriptor').lean();
  const contact = await ContactModel.findOne({ userId }).lean();
  if (!user || !user.descriptor || !contact) return res.status(404).json({ message: "Please fill in the contact form first" });

  const descriptor = await getDescriptorFromBuffer(req.file.buffer);
  if (calculateDistance(descriptor, user.descriptor) > 0.5) return res.status(400).json({ message: "Face does not match" });

  const timestamp = new Date();
  const { date, time, full } = formatWIB(timestamp);

  const attendance = await AttendanceModel.create({
    userId,
    type: "check-out",
    timestamp,
    imageFileName: req.file.originalname || "unknown",
    location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude), name: locationName || "Unknown Location" }
  });

  res.json({
    success: true,
    message: "Check-out successful",
    timestampUTC: timestamp,
    timestampWIB: { date, time, full },
    user: { _id: user._id, fullName: user.fullName, username: user.username, contact },
    attendance
  });
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const contact = await ContactModel.findOne({ userId: userId }).lean();
  if (!contact) return res.status(404).json({ message: "Contact not found" });

  const records = await AttendanceModel.find({ userId }).sort({ timestamp: -1 });

  res.json({
    success: true,
    message: `History for user ${req.user.id}`,
    user: {
      contact: {
        email: contact.email,
        address: contact.address,
        phone: contact.phone
      }
    },
    data: records
  });
};

export const getHistoryByDate = async (req: AuthenticatedRequest, res: Response) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date query is required, e.g., 2025-05-14" });

  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Invalid date format" });

  const userId = new mongoose.Types.ObjectId(req.user.id);
  const contact = await ContactModel.findOne({ userId: userId }).lean();
  if (!contact) return res.status(404).json({ message: "Contact not found" });

  const records = await AttendanceModel.find({
    userId,
    timestamp: { $gte: parsedDate, $lt: new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000) }
  });

  res.json({
    success: true,
    message: `History for user ${req.user.id} on ${date}`,
    user: {
      contact: {
        email: contact.email,
        address: contact.address,
        phone: contact.phone
      }
    },
    data: records
  });
};

export const getAllAttendance = async (_req: Request, res: Response) => {
  try {
    const records = await AttendanceModel.find()
      .populate("userId", "fullName username")
      .sort({ timestamp: -1 });

    res.json({ success: true, message: "All attendance records retrieved", data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve attendance records", error });
  }
};


export const getAttendanceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const record = await AttendanceModel.findById(id).populate("userId", "fullName username");
    if (!record) return res.status(404).json({ success: false, message: "Attendance record not found" });

    res.json({ success: true, message: `Attendance record ${id} retrieved`, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve attendance record", error });
  }
};


export const getReport = async (_req: Request, res: Response) => {
  const records = await AttendanceModel.find()
    .populate("userId", "fullName username")
    .sort({ timestamp: -1 });

  res.json({ success: true, message: "All users attendance report", data: records });
};


export const getAttendanceStatistics = async (_req: Request, res: Response) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const checkIns = await AttendanceModel.find({ type: "check-in", timestamp: { $gte: startOfMonth } })
    .populate("userId", "fullName username");

  const checkOuts = await AttendanceModel.find({ type: "check-out", timestamp: { $gte: startOfMonth } })
    .populate("userId", "fullName username");

  const usersData = [];

  for (const r of [...checkIns, ...checkOuts]) {
    const contact = await ContactModel.findOne({ userId: r.userId._id }).lean();

    usersData.push({
      fullName: (r.userId as any)?.fullName,
      username: (r.userId as any)?.username,
      type: r.type,
      date: r.timestamp.toLocaleDateString('id-ID', {
        weekday: 'long', // Senin, Selasa, dll.
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: r.timestamp.toTimeString().split(' ')[0], // HH:MM:SS
      location: {
        latitude: r.location?.latitude,
        longitude: r.location?.longitude
      },
      contact: contact ? {
        email: contact.email,
        address: contact.address,
        phone: contact.phone
      } : {
        email: "Unknown",
        address: "Unknown",
        phone: "Unknown"
      }
    });
  }

  res.json({
    success: true,
    data: {
      month: startOfMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      checkIns: checkIns.length,
      checkOuts: checkOuts.length,
      attendanceRate: checkIns.length > 0 ? `${((checkOuts.length / checkIns.length) * 100).toFixed(2)}%` : "0%",
      users: usersData
    }
  });
};

