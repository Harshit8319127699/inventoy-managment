import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: "text" },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", sku: "text", category: "text" });

export type ProductDoc = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Product: Model<ProductDoc> =
  (mongoose.models["Product"] as Model<ProductDoc>) ||
  mongoose.model<ProductDoc>("Product", productSchema);
