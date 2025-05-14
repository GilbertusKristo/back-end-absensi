import express from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import aclMiddleware from '../middlewares/acl.middleware';
import contactController from '../controllers/contact.controller';
import permissionController from '../controllers/permission.controller';
import { ROLES } from '../utils/constant';
// import * as faceController from '../controllers/face.controller';
import multer from 'multer';
import mediaMiddleware from '../middlewares/media.middleware';
import { registerFace } from '../controllers/face.controller';
import { checkIn, checkOut, getHistory, getReport } from '../controllers/attendance.controller';
// import { matchFace, registerFace } from '../controllers/face.controller';

const Router = express.Router();

/* ------------------- AUTH ------------------- */

Router.post("/auth/register",
  // #swagger.tags = ['Auth']
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/RegisterRequest" } }
  authController.register
);

Router.post("/auth/login",
  // #swagger.tags = ['Auth']
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/LoginRequest" } }
  authController.login
);

Router.get("/auth/me",
  // #swagger.tags = ['Auth']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  authController.me
);

Router.get("/users", authMiddleware, aclMiddleware([ROLES.ADMIN]), authController.getAllUsers
  // #swagger.tags = ['Auth']
  // #swagger.security = [{ "bearerAuth": [] }]
);

Router.patch("/auth/profile-picture",
  authMiddleware,
  mediaMiddleware.single("profilePicture"),
  /* #swagger.tags = ['Auth']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.consumes = ['multipart/form-data']
     #swagger.requestBody = {
       required: true,
       content: {
         "multipart/form-data": {
           schema: {
             type: "object",
             properties: {
               profilePicture: {
                 type: "string",
                 format: "binary",
                 description: "Foto profil baru"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = { description: "Foto profil berhasil diperbarui" }
  */
  authController.updateProfilePicture
);

Router.patch("/auth/profile",
  authMiddleware,
  /* #swagger.tags = ['Auth']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: false,
       content: {
         "application/json": {
           schema: {
             type: "object",
             properties: {
               fullName: {
                 type: "string",
                 description: "Nama lengkap baru (opsional)"
               },
               username: {
                 type: "string",
                 description: "Username baru (opsional)"
               },
               role: {
                 type: "string",
                 enum: ["admin", "user"],
                 description: "Peran pengguna (opsional, default: user)"
               },
               isActive: {
                 type: "boolean",
                 description: "Status aktif (opsional)"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = { description: "Berhasil memperbarui data profil" }
  */
  authController.updateProfileData
);
Router.patch("/users/:id/profile-picture",
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  mediaMiddleware.single("profilePicture"),
  /* #swagger.tags = ['User']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.consumes = ['multipart/form-data']
     #swagger.requestBody = {
       required: true,
       content: {
         "multipart/form-data": {
           schema: {
             type: "object",
             properties: {
               profilePicture: {
                 type: "string",
                 format: "binary",
                 description: "Foto profil baru"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = { description: "Foto profil berhasil diperbarui" }
  */
  authController.updateProfilePictureById
);



Router.get("/users/:id",
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  /* #swagger.tags = ['User']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { description: "User details retrieved" }
  */
  authController.getUserById
);
Router.put("/users/:id",
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  /* #swagger.tags = ['User']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: "object",
             properties: {
               fullName: { type: "string" },
               username: { type: "string" },
               role: { type: "string", enum: ["admin", "user"] },
               isActive: { type: "boolean" }
             }
           }
         }
       }
     }
     #swagger.responses[200] = { description: "User updated successfully" }
  */
  authController.updateUserById
);

Router.delete("/users/:id",
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  /* #swagger.tags = ['User']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.responses[200] = { description: "User deleted successfully" }
  */
  authController.deleteUserById
);



/* ------------------- CONTACT (User) ------------------- */

Router.get("/contact",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  contactController.getContact
);

Router.post("/contact",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/ContactRequest" } }
  authMiddleware,
  aclMiddleware([ROLES.USER, ROLES.ADMIN]),
  contactController.createContact
);

Router.put("/contact",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/ContactRequest" } }
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  contactController.updateContact
);

/* ------------------- CONTACT (Admin) ------------------- */

Router.get("/contact/all",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  contactController.getAllContacts
);

Router.delete("/contact/:userId",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  contactController.deleteContactByAdmin
);

Router.get("/contact/:userId",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['userId'] = { description: "ID of the user whose contact you want to retrieve" }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  contactController.getContactById
);

Router.patch("/contact/:userId",
  // #swagger.tags = ['Contact']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['userId'] = { description: "ID of the user whose contact you want to update" }
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/ContactRequest" } }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  contactController.updateContactById
);


/* ------------------- PERMISSION ------------------- */

// ------------------- PERMISSION (User) -------------------

Router.post('/permission',
  authMiddleware,
  aclMiddleware([ROLES.USER, ROLES.ADMIN]),
  mediaMiddleware.single("dokumenPendukung"),
  /* #swagger.tags = ['Permission']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "multipart/form-data": {
           schema: {
             type: "object",
             properties: {
               tanggalMulai: {
                 type: "string",
                 format: "date",
                 description: "Tanggal mulai izin"
               },
               tanggalSelesai: {
                 type: "string",
                 format: "date",
                 description: "Tanggal selesai izin"
               },
               jenisPermission: {
                 type: "string",
                 description: "Jenis izin (Sakit, Cuti, dll)"
               },
               alasan: {
                 type: "string",
                 description: "Alasan pengajuan izin"
               },
               dokumenPendukung: {
                 type: "string",
                 format: "binary",
                 description: "Dokumen pendukung (gambar/pdf)"
               }
             }
           }
         }
       }
     }
     #swagger.responses[201] = {
       description: 'Permission berhasil diajukan'
     }
  */
  permissionController.createPermission
);







Router.get("/permission/me",
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  permissionController.getMyPermissions
);

// ------------------- PERMISSION (Admin) -------------------

Router.get("/permission",
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  permissionController.getAllPermissions
);

Router.get("/permission/:id",
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { description: "Permission ID to retrieve" }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  permissionController.getPermissionById
);

Router.patch("/permission/:id",
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  mediaMiddleware.single("dokumenPendukung"),
  /* #swagger.tags = ['Permission']
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.parameters['id'] = { 
       in: 'path',
       required: true,
       description: 'Permission ID yang ingin diperbarui'
     }
     #swagger.consumes = ['multipart/form-data']
     #swagger.requestBody = {
       required: false,
       content: {
         "multipart/form-data": {
           schema: {
             type: "object",
             properties: {
               tanggalMulai: {
                 type: "string",
                 format: "date",
                 description: "Tanggal mulai izin (opsional)"
               },
               tanggalSelesai: {
                 type: "string",
                 format: "date",
                 description: "Tanggal selesai izin (opsional)"
               },
               jenisPermission: {
                 type: "string",
                 description: "Jenis izin (Sakit, Cuti, dll) (opsional)"
               },
               alasan: {
                 type: "string",
                 description: "Alasan pengajuan izin (opsional)"
               },
               status: {
                 type: "string",
                 enum: ["Pending", "Disetujui", "Ditolak"],
                 description: "Status baru izin (opsional)"
               },
               dokumenPendukung: {
                 type: "string",
                 format: "binary",
                 description: "Dokumen pendukung baru (gambar/pdf) (opsional)"
               }
             }
           }
         }
       }
     }
     #swagger.responses[200] = { description: "Berhasil memperbarui izin" }
  */
  permissionController.updatePermissionById
);




Router.put("/permission/:id/approve",
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { description: "Permission ID to approve" }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  permissionController.approvePermission
);

Router.delete("/permission/:id",
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { description: "Permission ID to delete" }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
  permissionController.deletePermission
);


Router.post(
  "/face/register",
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  mediaMiddleware.single("image"),
  registerFace
);

// Verifikasi wajah (hanya untuk user yang sudah login dan berperan 'user')


// Check-in (absen masuk) - hanya user yang login
Router.post(
  "/attendance/check-in",
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  mediaMiddleware.single("image"),  // ✅ Harus ada ini
  checkIn
);


// Check-out (absen pulang) - hanya user yang login
Router.post(
  "/attendance/check-out",
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  mediaMiddleware.single("image"),  // ✅ Harus ada ini
  checkOut
);

// Riwayat absensi user yang login
Router.get("/attendance/history", authMiddleware, aclMiddleware([ROLES.ADMIN]), getHistory);

// Rekap semua absensi - hanya untuk admin
Router.get("/attendance/report", authMiddleware, aclMiddleware([ROLES.ADMIN]), getReport);

export default Router;