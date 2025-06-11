import { Request, Response } from "express";
import UserModel from "../models/user.model";
import AttendanceModel from "../models/attendance.model";
import { calculateDistance, getDescriptorFromBuffer } from "../utils/face.utils";
import mongoose from "mongoose";
import ContactModel from "../models/contact.model";
import { formatWIB } from "../utils/date.utils";
import uploader from "../utils/uploader";

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
  try {
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

    // ✅ Verifikasi wajah
    const descriptor = await getDescriptorFromBuffer(req.file.buffer);
    if (calculateDistance(descriptor, user.descriptor) > 0.5) return res.status(400).json({ message: "Face does not match" });

    // ✅ Upload ke Cloudinary
    const { buffer, mimetype, originalname } = req.file;
    const uploadResult = await uploader.uploadSingle({ buffer, mimetype });

    // ✅ Simpan absensi
    const timestamp = new Date();
    const { date, time, full } = formatWIB(timestamp);

    const attendance = await AttendanceModel.create({
      userId,
      type: "check-in",
      timestamp,
      imageFileName: originalname || "unknown",
      imageUrl: uploadResult.secure_url,
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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No face image uploaded" });

    const { latitude, longitude, locationName } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ message: "Location information is required" });

    const userId = req.user.id;
    const user = await UserModel.findById(userId).select('_id fullName username descriptor').lean();
    const contact = await ContactModel.findOne({ userId }).lean();
    if (!user || !user.descriptor || !contact) return res.status(404).json({ message: "Please fill in the contact form first" });

    // ✅ Verifikasi wajah
    const descriptor = await getDescriptorFromBuffer(req.file.buffer);
    if (calculateDistance(descriptor, user.descriptor) > 0.5) return res.status(400).json({ message: "Face does not match" });

    // ✅ Upload ke Cloudinary
    const { buffer, mimetype, originalname } = req.file;
    const uploadResult = await uploader.uploadSingle({ buffer, mimetype });

    // ✅ Simpan absensi
    const timestamp = new Date();
    const { date, time, full } = formatWIB(timestamp);

    const attendance = await AttendanceModel.create({
      userId,
      type: "check-out",
      timestamp,
      imageFileName: originalname || "unknown",
      imageUrl: uploadResult.secure_url,
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
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
export const getMyAttendance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const records = await AttendanceModel.find({ userId }).sort({ timestamp: -1 });

    return res.status(200).json({
      success: true,
      message: "Attendance records retrieved for logged-in user",
      data: records
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance",
      error: (error as Error).message
    });
  }
};
export const getMyAttendanceDetailById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid attendance ID format" });
    }

    const attendance = await AttendanceModel.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Detail attendance with ID ${id} retrieved`,
      data: attendance
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance detail",
      error: (error as Error).message
    });
  }
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
export const adminCheckInById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admin can perform this action" });
    }

    const { latitude, longitude, locationName } = req.body;
    const { userId } = req.params;

    if (!userId || !latitude || !longitude || !req.file) {
      return res.status(400).json({ message: "userId (in URL), latitude, longitude, and face image are required" });
    }

    const user = await UserModel.findById(userId).select('_id fullName username descriptor').lean();
    const contact = await ContactModel.findOne({ userId }).lean();
    if (!user || !user.descriptor || !contact) {
      return res.status(404).json({ message: "User or contact data not found" });
    }

    const descriptor = await getDescriptorFromBuffer(req.file.buffer);
    const distance = calculateDistance(descriptor, user.descriptor);
    if (distance > 0.5) return res.status(400).json({ message: "Face does not match the selected user" });

    const uploadResult = await uploader.uploadSingle({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    });

    const timestamp = new Date();
    const { date, time, full } = formatWIB(timestamp);

    const attendance = await AttendanceModel.create({
      userId,
      type: "check-in",
      timestamp,
      imageFileName: req.file.originalname || "admin_upload",
      imageUrl: uploadResult.secure_url,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: locationName || "Unknown Location"
      },
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Check-in successful for user ${user.username}`,
      timestampUTC: timestamp,
      timestampWIB: { date, time, full },
      user: { _id: user._id, fullName: user.fullName, username: user.username, contact },
      attendance
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
export const deleteAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const attendance = await AttendanceModel.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Data absensi tidak ditemukan"
      });
    }

    await AttendanceModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Data absensi dengan ID ${id} berhasil dihapus`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus data absensi",
      error: (error as Error).message
    });
  }
};



export const adminCheckOutById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admin can perform this action" });
    }

    const { latitude, longitude, locationName } = req.body;
    const { userId } = req.params;

    if (!userId || !latitude || !longitude || !req.file) {
      return res.status(400).json({
        message: "userId (from URL), latitude, longitude, and image file are required"
      });
    }

    // ✅ Ambil data user target
    const user = await UserModel.findById(userId).select('_id fullName username descriptor').lean();
    const contact = await ContactModel.findOne({ userId }).lean();

    if (!user || !user.descriptor || !contact) {
      return res.status(404).json({ message: "User or contact data not found" });
    }

    // ✅ Verifikasi wajah
    const descriptor = await getDescriptorFromBuffer(req.file.buffer);
    const distance = calculateDistance(descriptor, user.descriptor);
    if (distance > 0.5) {
      return res.status(400).json({ message: "Face does not match the selected user" });
    }

    // ✅ Upload gambar ke Cloudinary
    const uploadResult = await uploader.uploadSingle({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype
    });

    // ✅ Simpan data absensi
    const timestamp = new Date();
    const { date, time, full } = formatWIB(timestamp);

    const attendance = await AttendanceModel.create({
      userId,
      type: "check-out",
      timestamp,
      imageFileName: req.file.originalname || "admin_upload",
      imageUrl: uploadResult.secure_url,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: locationName || "Unknown Location"
      },
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Check-out successful for user ${user.username}`,
      timestampUTC: timestamp,
      timestampWIB: { date, time, full },
      user: { _id: user._id, fullName: user.fullName, username: user.username, contact },
      attendance
    });

  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
  
};


export const getAttendanceDetailById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const attendance = await AttendanceModel.findById(id).populate("userId", "fullName username");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: `Data absensi dengan ID ${id} tidak ditemukan`
      });
    }

    res.status(200).json({
      success: true,
      message: `Berhasil mengambil data absensi dengan ID ${id}`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data absensi",
      error: (error as Error).message
    });
  }
};


