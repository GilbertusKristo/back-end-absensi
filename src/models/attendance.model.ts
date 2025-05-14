import { Schema, model, Document, Types } from "mongoose";

// Interface gunakan Types.ObjectId bukan string
interface IAttendance extends Document {
  userId: Types.ObjectId;
  type: "check-in" | "check-out";
  timestamp: Date;
}

// Definisi Schema
const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["check-in", "check-out"], required: true },
  timestamp: { type: Date, default: Date.now },
});

// Export Model
export default model<IAttendance>("Attendance", AttendanceSchema);
