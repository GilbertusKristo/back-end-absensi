import mongoose, { ObjectId, Schema, Document } from "mongoose";
import * as Yup from "yup";

// ✅ Yup Schema (Validator)
export const contactDAO = Yup.object({
  userId: Yup.string().required(),
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
  email: Yup.string().email().required(),
  address: Yup.string().required(),
  phone: Yup.string().required(),
});

export const contactUpdateDAO = Yup.object().shape({
  firstName: Yup.string(),
  lastName: Yup.string(),
  email: Yup.string().email(),
  address: Yup.string(),
  phone: Yup.string(),
});

// ✅ Type & Interface
export type TContact = Yup.InferType<typeof contactDAO>;

export interface Contact extends Omit<TContact, "userId"> {
  userId: ObjectId;
}

// ✅ Mongoose Schema
const ContactSchema = new Schema<Contact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // memastikan satu user hanya punya satu contact
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ContactModel = mongoose.model<Contact>("Contact", ContactSchema);
export default ContactModel;
