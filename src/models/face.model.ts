import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface Face extends Document {
  userId: ObjectId;
  descriptor: number[]; // 128 float values
}

const FaceSchema = new Schema<Face>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  descriptor: {
    type: [Number],
    required: true,
  },
});

const FaceModel = mongoose.model<Face>("Face", FaceSchema);
export default FaceModel;
