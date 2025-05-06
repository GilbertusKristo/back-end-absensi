import mongoose, { Schema, Document, ObjectId } from "mongoose";
import * as Yup from "yup";

// Yup Validator
export const permissionDAO = Yup.object({
  userId: Yup.string().required(),
  tanggalMulai: Yup.date().required(),
  tanggalSelesai: Yup.date().required(),
  jenisPermission: Yup.string()
    .oneOf([
      "Sakit",
      "Cuti",
      "Izin Pribadi",
      "Izin Keluarga",
      "Dinas Luar",
      "Cuti Melahirkan",
      "Cuti Tahunan",
    ])
    .required(),
  alasan: Yup.string().required(),
  dokumenPendukung: Yup.string().url().optional(),
});

// Type & Interface
export type TPermission = Yup.InferType<typeof permissionDAO>;

export interface Permission extends Omit<TPermission, "userId"> {
  userId: ObjectId;
  status: "Pending" | "Disetujui" | "Ditolak";
  disetujuiOleh?: ObjectId | null;
}

// Mongoose Schema
const PermissionSchema = new Schema<Permission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tanggalMulai: {
      type: Date,
      required: true,
    },
    tanggalSelesai: {
      type: Date,
      required: true,
    },
    jenisPermission: {
      type: String,
      required: true,
    },
    alasan: {
      type: String,
      required: true,
    },
    dokumenPendukung: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Disetujui", "Ditolak"],
      default: "Pending",
    },
    disetujuiOleh: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const PermissionModel = mongoose.model<Permission>("Permission", PermissionSchema);
export default PermissionModel;
