import express from 'express';
import authController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.middleware';
import aclMiddleware from '../middlewares/acl.middleware';
import contactController from '../controllers/contact.controller';
import permissionController from '../controllers/permission.controller';
import { ROLES } from '../utils/constant';

const Router = express.Router();

/* ------------------- AUTH ------------------- */

/**
 * #swagger.tags = ['Auth']
 * #swagger.requestBody = {
 *   required: true,
 *   schema: { $ref: "#/components/schemas/RegisterRequest" }
 * }
 */
Router.post("/auth/register", authController.register);

/**
 * #swagger.tags = ['Auth']
 * #swagger.requestBody = {
 *   required: true,
 *   schema: { $ref: "#/components/schemas/LoginRequest" }
 * }
 */
Router.post("/auth/login", authController.login);

/**
 * #swagger.tags = ['Auth']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.get("/auth/me", authMiddleware, authController.me);

/* ------------------- CONTACT (User) ------------------- */

/**
 * #swagger.tags = ['Contact']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.get("/contact", authMiddleware, aclMiddleware([ROLES.USER]), contactController.getContact);

/**
 * #swagger.tags = ['Contact']
 * #swagger.security = [{ "bearerAuth": [] }]
 * #swagger.requestBody = {
 *   required: true,
 *   schema: { $ref: "#/components/schemas/ContactRequest" }
 * }
 */
Router.post("/contact", authMiddleware, aclMiddleware([ROLES.USER]), contactController.createContact);

/**
 * #swagger.tags = ['Contact']
 * #swagger.security = [{ "bearerAuth": [] }]
 * #swagger.requestBody = {
 *   required: true,
 *   schema: { $ref: "#/components/schemas/ContactRequest" }
 * }
 */
Router.put("/contact", authMiddleware, aclMiddleware([ROLES.USER]), contactController.updateContact);

/* ------------------- CONTACT (Admin) ------------------- */

/**
 * #swagger.tags = ['Contact']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.get("/contact/all", authMiddleware, aclMiddleware([ROLES.ADMIN]), contactController.getAllContacts);

/**
 * #swagger.tags = ['Contact']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.delete("/contact/:userId", authMiddleware, aclMiddleware([ROLES.ADMIN]), contactController.deleteContactByAdmin);

/* ------------------- PERMISSION ------------------- */

/**
 * #swagger.tags = ['Permission']
 * #swagger.security = [{ "bearerAuth": [] }]
 * #swagger.requestBody = {
 *   required: true,
 *   schema: { $ref: "#/components/schemas/PermissionRequest" }
 * }
 */
Router.post("/permission", authMiddleware, aclMiddleware([ROLES.USER]), permissionController.createPermission);

/**
 * #swagger.tags = ['Permission']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.get("/permission/me", authMiddleware, aclMiddleware([ROLES.USER]), permissionController.getMyPermissions);

/**
 * #swagger.tags = ['Permission']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.get("/permission", authMiddleware, aclMiddleware([ROLES.ADMIN]), permissionController.getAllPermissions);

/**
 * #swagger.tags = ['Permission']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.put("/permission/:id/approve", authMiddleware, aclMiddleware([ROLES.ADMIN]), permissionController.approvePermission);

/**
 * #swagger.tags = ['Permission']
 * #swagger.security = [{ "bearerAuth": [] }]
 */
Router.delete("/permission/:id", authMiddleware, aclMiddleware([ROLES.ADMIN]), permissionController.deletePermission);

export default Router;
