import { Router, type IRouter } from "express";
import { Product } from "../models/Product";
import { Movement } from "../models/Movement";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/summary", async (_req, res, next) => {
  try {
    const [
      totalProducts,
      lowStockItems,
      categoriesAgg,
      stockValueAgg,
      totalUnitsAgg,
      recentMovements,
      movementsByDayAgg,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.find({
        $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
      })
        .sort({ quantity: 1 })
        .limit(10)
        .lean(),
      Product.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate<{ _id: null; value: number }>([
        {
          $group: {
            _id: null,
            value: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
      ]),
      Product.aggregate<{ _id: null; units: number }>([
        { $group: { _id: null, units: { $sum: "$quantity" } } },
      ]),
      Movement.find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("product", "name sku")
        .lean(),
      Movement.aggregate<{
        _id: { day: string; type: string };
        quantity: number;
      }>([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
            },
          },
        },
        {
          $group: {
            _id: {
              day: {
                $dateToString: { date: "$createdAt", format: "%Y-%m-%d" },
              },
              type: "$type",
            },
            quantity: { $sum: "$quantity" },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
    ]);

    res.json({
      totalProducts,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((p) => ({
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        category: p.category,
        quantity: p.quantity,
        lowStockThreshold: p.lowStockThreshold,
      })),
      totalStockValue: stockValueAgg[0]?.value ?? 0,
      totalUnits: totalUnitsAgg[0]?.units ?? 0,
      categories: categoriesAgg.map((c) => ({
        category: c._id,
        count: c.count,
      })),
      recentMovements: recentMovements.map((m) => ({
        id: String(m._id),
        type: m.type,
        quantity: m.quantity,
        note: m.note,
        createdAt: m.createdAt,
        product:
          m.product && typeof m.product === "object" && "_id" in m.product
            ? {
                id: String((m.product as { _id: unknown })._id),
                name: (m.product as { name?: string }).name ?? "",
                sku: (m.product as { sku?: string }).sku ?? "",
              }
            : { id: String(m.product), name: "", sku: "" },
      })),
      movementsByDay: movementsByDayAgg.map((row) => ({
        day: row._id.day,
        type: row._id.type,
        quantity: row.quantity,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
