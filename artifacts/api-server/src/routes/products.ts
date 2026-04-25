import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Product } from "../models/Product";
import { Movement } from "../models/Movement";
import { requireAuth, requireRole } from "../middlewares/auth";
import { HttpError } from "../middlewares/error";

const router: IRouter = Router();

const productInput = z.object({
  name: z.string().min(1).max(160),
  sku: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9\-_]+$/, "SKU may only contain letters, numbers, - and _"),
  category: z.string().min(1).max(80),
  description: z.string().max(2000).optional().default(""),
  price: z.number().nonnegative(),
  quantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
});

const productUpdate = productInput.partial();

const sortAliases = {
  name_asc: "name",
  name_desc: "-name",
  quantity_asc: "quantity",
  quantity_desc: "-quantity",
  price_asc: "price",
  price_desc: "-price",
  created_at_asc: "createdAt",
  created_at_desc: "-createdAt",
} as const;

const sortValue = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return sortAliases[value as keyof typeof sortAliases] ?? value;
}, z.enum(["name", "-name", "quantity", "-quantity", "price", "-price", "createdAt", "-createdAt"]));

const listQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z
    .union([z.literal("true"), z.literal("false")])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: sortValue.default("-createdAt"),
});

function serialize(p: {
  _id: unknown;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(p._id),
    name: p.name,
    sku: p.sku,
    category: p.category,
    description: p.description,
    price: p.price,
    quantity: p.quantity,
    lowStockThreshold: p.lowStockThreshold,
    isLowStock: p.quantity <= p.lowStockThreshold,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const q = listQuery.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (q.search) {
      const re = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter["$or"] = [{ name: re }, { sku: re }, { category: re }];
    }
    if (q.category) filter["category"] = q.category;
    if (q.lowStock === "true") {
      filter["$expr"] = { $lte: ["$quantity", "$lowStockThreshold"] };
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(q.sort)
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean(),
      Product.countDocuments(filter),
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

router.get("/categories", async (_req, res, next) => {
  try {
    const cats = await Product.distinct("category");
    res.json({ items: cats.sort() });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || !mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
    const p = await Product.findById(id).lean();
    if (!p) throw new HttpError(404, "Product not found");
    res.json(serialize(p));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const body = productInput.parse(req.body);
    const p = await Product.create(body);
    res.status(201).json(serialize(p.toObject()));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || !mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
    const body = productUpdate.parse(req.body);
    const p = await Product.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!p) throw new HttpError(404, "Product not found");
    res.json(serialize(p));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id || !mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
    const p = await Product.findByIdAndDelete(id);
    if (!p) throw new HttpError(404, "Product not found");
    await Movement.deleteMany({ product: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
