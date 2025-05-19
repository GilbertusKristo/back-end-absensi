import { Schema, model, Document, Types } from "mongoose";

// Interface gunakan Types.ObjectId bukan string
interface IAttendance extends Document {
  userId: Types.ObjectId;
  type: "check-in" | "check-out";
  timestamp: Date;
  imageFileName?: string;
  imageUrl?: string; // ✅ Tambahan field untuk URL Cloudinary
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

// Definisi Schema
const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["check-in", "check-out"], required: true },
  timestamp: { type: Date, default: Date.now },

  imageFileName: { type: String },

  // ✅ Field baru untuk URL gambar di Cloudinary
  imageUrl: { type: String },

  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    name: { type: String }
  }
});

// Export Model
export default model<IAttendance>("Attendance", AttendanceSchema);
