import { Request, Response } from "express";
import ContactModel, { contactUpdateDAO } from "../models/contact.model";
import { contactDAO } from "../models/contact.model"
import { IReqUser } from "../utils/interfaces";

export default {
    async createContact(req: IReqUser, res: Response) {
        try {
            const validated = await contactDAO.validate({ ...req.body, userId: req.user?.id });

            const existing = await ContactModel.findOne({ userId: req.user?.id });
            if (existing) {
                return res.status(400).json({
                    message: "Contact already exists",
                    data: null,
                });
            }

            const newContact = await ContactModel.create(validated);

            res.status(201).json({
                message: "Contact created successfully",
                data: newContact,
            });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            });
        }
    },



    async updateContact(req: IReqUser, res: Response) {
        try {
            const validated = await contactUpdateDAO.validate(req.body);

            const existing = await ContactModel.findOne({ userId: req.user?.id });
            if (!existing) {
                return res.status(404).json({
                    message: "No contact to update",
                    data: null,
                });
            }

            const updated = await ContactModel.findOneAndUpdate(
                { userId: req.user?.id },
                { $set: validated },
                { new: true }
            );

            res.status(200).json({
                message: "Contact updated successfully",
                data: updated,
            });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            });
        }
    },




    async getContact(req: IReqUser, res: Response) {
        /**
         * #swagger.tags = ['Contact']
         * #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
            const contact = await ContactModel.findOne({ userId: req.user?.id });

            if (!contact) {
                return res.status(404).json({
                    message: "Contact not found",
                    data: null,
                });
            }

            res.status(200).json({
                message: "Contact retrieved successfully",
                data: contact,
            });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            });
        }
    },
    async getAllContacts(req: IReqUser, res: Response) {
        try {
            const contacts = await ContactModel.find().populate("userId", "fullName username");

            res.status(200).json({
                message: "All contacts retrieved successfully",
                data: contacts,
            });
        } catch (error) {
            const err = error as Error;
            res.status(500).json({
                message: err.message,
                data: null,
            });
        }
    },


    async deleteContactByAdmin(req: Request, res: Response) {
        const userIdToDelete = req.params.userId;

        try {
            const deleted = await ContactModel.findOneAndDelete({ userId: userIdToDelete });

            if (!deleted) {
                return res.status(404).json({
                    message: "Contact not found for the specified user",
                    data: null,
                });
            }

            res.status(200).json({
                message: "Contact deleted successfully by admin",
                data: deleted,
            });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({
                message: err.message,
                data: null,
            });
        }
    },

};
