import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Movement } from "../models/Movement";
import { Product } from "../models/Product";
import { requireAuth, requireRole } from "../middlewares/auth";
import { HttpError } from "../middlewares/error";

const router: IRouter = Router();

const createSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().min(1),
  note: z.string().max(500).optional().default(""),
});

const listQuery = z.object({
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function serialize(m: {
  _id: unknown;
  product: unknown;
  type: string;
  quantity: number;
  note: string;
  user: unknown;
  createdAt?: Date;
}) {
  const product =
    m.product && typeof m.product === "object" && "_id" in m.product
      ? {
          id: String((m.product as { _id: unknown })._id),
          name: (m.product as { name?: string }).name ?? "",
          sku: (m.product as { sku?: string }).sku ?? "",
        }
      : { id: String(m.product), name: "", sku: "" };
  return {
    id: String(m._id),
    product,
    type: m.type,
    quantity: m.quantity,
    note: m.note,
    userId: String(m.user),
    createdAt: m.createdAt,
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (q.productId && mongoose.isValidObjectId(q.productId)) {
      filter["product"] = q.productId;
    }
    if (q.type) filter["type"] = q.type;
    const [items, total] = await Promise.all([
      Movement.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .populate("product", "name sku")
        .lean(),
      Movement.countDocuments(filter),
    ]);
    res.json({
      items: items.map(serialize),
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    if (!mongoose.isValidObjectId(body.productId)) {
      throw new HttpError(400, "Invalid productId");
    }
    const product = await Product.findById(body.productId);
    if (!product) throw new HttpError(404, "Product not found");

    const delta = body.type === "IN" ? body.quantity : -body.quantity;
    const newQty = product.quantity + delta;
    if (newQty < 0) {
      throw new HttpError(
        400,
        `Insufficient stock. Current quantity is ${product.quantity}, cannot remove ${body.quantity}.`,
      );
    }

    product.quantity = newQty;
    await product.save();

    const m = await Movement.create({
      product: product._id,
      type: body.type,
      quantity: body.quantity,
      note: body.note,
      user: req.user!.sub,
    });
    const populated = await Movement.findById(m._id)
      .populate("product", "name sku")
      .lean();
    res.status(201).json(serialize(populated!));
  } catch (err) {
    next(err);
  }
});

export default router;
