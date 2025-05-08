import { Request, Response } from "express";
import PermissionModel, { permissionDAO } from "../models/permission.model";
import { IReqUser } from "../utils/interfaces";

export default {
  async createPermission(req: IReqUser, res: Response) {
    try {
      const validated = await permissionDAO.validate({ ...req.body, userId: req.user?.id });
      const permission = await PermissionModel.create(validated);

      res.status(201).json({
        message: "Permission request submitted",
        data: permission,
      });
    } catch (error) {
      res.status(400).json({
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
