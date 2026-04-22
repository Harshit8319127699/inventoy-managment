import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const movementSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: "", trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

movementSchema.index({ createdAt: -1 });

export type MovementDoc = InferSchemaType<typeof movementSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Movement: Model<MovementDoc> =
  (mongoose.models["Movement"] as Model<MovementDoc>) ||
  mongoose.model<MovementDoc>("Movement", movementSchema);
