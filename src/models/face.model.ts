import mongoose, { Schema, Document } from "mongoose";

export interface IFace extends Document {
  userId: mongoose.Types.ObjectId;
  descriptor: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

const FaceSchema = new Schema<IFace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    descriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: (desc: number[]) => desc.length === 128,
        message: "Face descriptor must be 128 float values",
      },
    },
  },
  { timestamps: true }
);

FaceSchema.index({ userId: 1 });

const FaceModel = mongoose.model<IFace>("Face", FaceSchema);
export default FaceModel;
