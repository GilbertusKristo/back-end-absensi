import express from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import aclMiddleware from '../middlewares/acl.middleware';
import contactController from '../controllers/contact.controller';
import permissionController from '../controllers/permission.controller';
import { ROLES } from '../utils/constant';

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

Router.get("/users", authMiddleware, aclMiddleware([ROLES.ADMIN]), authController.getAllUsers);

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

/* ------------------- PERMISSION ------------------- */

Router.post("/permission", 
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.requestBody = { required: true, schema: { $ref: "#/components/schemas/PermissionRequest" } }
  authMiddleware, 
  aclMiddleware([ROLES.USER]), 
  permissionController.createPermission
);

Router.get("/permission/me", 
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware, 
  aclMiddleware([ROLES.USER]), 
  permissionController.getMyPermissions
);

Router.get("/permission", 
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware, 
  aclMiddleware([ROLES.ADMIN]), 
  permissionController.getAllPermissions
);

Router.put("/permission/:id/approve", 
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware, 
  aclMiddleware([ROLES.ADMIN]), 
  permissionController.approvePermission
);

Router.delete("/permission/:id", 
  // #swagger.tags = ['Permission']
  // #swagger.security = [{ "bearerAuth": [] }]
  authMiddleware, 
  aclMiddleware([ROLES.ADMIN]), 
  permissionController.deletePermission
);

export default Router;
