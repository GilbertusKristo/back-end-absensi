import { Request, Response } from "express";
import PermissionModel, { permissionDAO } from "../models/permission.model";
import { IReqUser } from "../utils/interfaces";
import uploader from "../utils/uploader";

export default {
  async createPermission(req: IReqUser, res: Response) {
    try {
      const { tanggalMulai, tanggalSelesai, jenisPermission, alasan } = req.body;

      // Cek field kosong satu per satu
      const missingFields: string[] = [];
      if (!tanggalMulai) missingFields.push("tanggalMulai");
      if (!tanggalSelesai) missingFields.push("tanggalSelesai");
      if (!jenisPermission) missingFields.push("jenisPermission");
      if (!alasan) missingFields.push("alasan");

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Field berikut wajib diisi: ${missingFields.join(", ")}`,
          data: null,
        });
      }

      // Proses upload file jika ada
      let dokumenPendukungUrl: string | undefined;
      if (req.file) {
        const { buffer, mimetype } = req.file;
        const result = await uploader.uploadSingle({ buffer, mimetype });
        dokumenPendukungUrl = result.secure_url;
      }

      const payload = {
        userId: req.user?.id,
        tanggalMulai,
        tanggalSelesai,
        jenisPermission,
        alasan,
        dokumenPendukung: dokumenPendukungUrl,
      };

      const permission = await PermissionModel.create(payload);

      res.status(201).json({
        message: "Permission request submitted",
        data: permission,
      });

    } catch (error) {
      res.status(500).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },




  async getMyPermissions(req: IReqUser, res: Response) {
    try {
      const list = await PermissionModel.find({ userId: req.user?.id }).sort({ createdAt: -1 });

      res.status(200).json({
        message: "My permission list retrieved",
        data: list,
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },

  async getAllPermissions(req: IReqUser, res: Response) {
    try {
      const list = await PermissionModel.find().populate("userId", "fullName username");

      res.status(200).json({
        message: "All permission requests retrieved",
        data: list,
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },
  async getPermissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const permission = await PermissionModel.findById(id).populate("userId", "fullName username");

      if (!permission) {
        return res.status(404).json({
          message: "Permission not found",
          data: null,
        });
      }

      res.status(200).json({
        message: "Permission retrieved successfully",
        data: permission,
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },

  async updatePermissionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await PermissionModel.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          message: "Permission not found",
          data: null,
        });
      }

      res.status(200).json({
        message: "Permission updated successfully",
        data: updated,
      });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },



  async approvePermission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await PermissionModel.findByIdAndUpdate(
        id,
        { status: "Disetujui", disetujuiOleh: (req as IReqUser).user?.id },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Permission not found", data: null });
      }

      res.status(200).json({ message: "Permission approved", data: updated });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },

  async deletePermission(req: Request, res: Response) {
    try {
      const deleted = await PermissionModel.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Permission not found", data: null });
      }

      res.status(200).json({ message: "Permission deleted", data: deleted });
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        data: null,
      });
    }
  },
};