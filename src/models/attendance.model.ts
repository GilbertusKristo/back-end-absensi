import { Schema, model, Document, Types } from "mongoose";

interface IAttendance extends Document {
  userId: Types.ObjectId;
  type: "check-in" | "check-out";
  timestamp: Date;
  imageFileName?: string;
  imageUrl?: string; 
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

const AttendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["check-in", "check-out"], required: true },
  timestamp: { type: Date, default: Date.now },
  imageFileName: { type: String },
  imageUrl: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    name: { type: String }
  }
});


export default model<IAttendance>("Attendance", AttendanceSchema);
