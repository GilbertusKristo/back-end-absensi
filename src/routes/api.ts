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
  aclMiddleware([ROLES.USER]), 
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

Router.post("/permission",
  /**
   * #swagger.tags = ['Permission']
   * #swagger.summary = 'Create Permission'
   * #swagger.description = 'Endpoint untuk membuat pengajuan izin pengguna dengan dokumen pendukung yang diunggah ke Cloudinary.'
   * #swagger.security = [{ "bearerAuth": [] }]
   * #swagger.consumes = ['multipart/form-data']
   * #swagger.parameters['dokumenPendukung'] = {
   *    in: 'formData',
   *    type: 'file',
   *    required: true,
   *    description: 'Dokumen pendukung seperti foto atau PDF'
   * }
   * #swagger.parameters['tanggalMulai'] = {
   *    in: 'formData',
   *    type: 'string',
   *    required: true,
   *    example: '2025-05-10'
   * }
   * #swagger.parameters['tanggalSelesai'] = {
   *    in: 'formData',
   *    type: 'string',
   *    required: true,
   *    example: '2025-05-12'
   * }
   * #swagger.parameters['jenisPermission'] = {
   *    in: 'formData',
   *    type: 'string',
   *    required: true,
   *    enum: ['Sakit', 'Cuti', 'Izin Pribadi', 'Izin Keluarga', 'Dinas Luar', 'Cuti Melahirkan', 'Cuti Tahunan']
   * }
   * #swagger.parameters['alasan'] = {
   *    in: 'formData',
   *    type: 'string',
   *    required: true,
   *    example: 'Pergi ke acara keluarga'
   * }
   * #swagger.responses[201] = {
   *    description: 'Permission request submitted',
   *    schema: { "$ref": "#/components/schemas/PermissionResponse" }
   * }
   * #swagger.responses[400] = {
   *    description: 'Bad Request',
   *    schema: { message: "Error message", data: null }
   * }
   */
  authMiddleware,
  aclMiddleware([ROLES.USER]),
  mediaMiddleware.single("dokumenPendukung"),
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
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { description: "Permission ID to update" }
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/PermissionRequest" } }
  authMiddleware,
  aclMiddleware([ROLES.ADMIN]),
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


/* ------------------- FACE ------------------- */


// const upload = multer({ dest: 'uploads/' }); // folder sementara untuk simpan gambar wajah

// Router.post(
//   "/face/register",
//   // #swagger.tags = ['Face']
//   // #swagger.security = [{ "bearerAuth": [] }]
//   // #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } }
//   authMiddleware,
//   aclMiddleware([ROLES.USER]),
//   upload.single("file"),
//   faceController.registerFace
// );

// Router.post(
//   "/face/match",
//   // #swagger.tags = ['Face']
//   // #swagger.security = [{ "bearerAuth": [] }]
//   // #swagger.requestBody = { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } }
//   authMiddleware,
//   aclMiddleware([ROLES.USER]),
//   upload.single("file"),
//   faceController.matchFace
// );
// const upload = multer({ dest: 'uploads/' });
// Router.post('/face/register', upload.single('image'), registerFace);
// Router.post('/face/match', upload.single('image'), matchFace);

export default Router;