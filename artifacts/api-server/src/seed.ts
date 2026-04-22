import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { Product } from "./models/Product";
import { Movement } from "./models/Movement";
import { logger } from "./lib/logger";

interface SeedProduct {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
}

const seedProducts: SeedProduct[] = [
  {
    name: 'Steel Shelving Unit 72"',
    sku: "SHELF-72-STL",
    category: "Storage",
    description: "Heavy-duty 5-tier steel shelving for warehouse racks.",
    price: 189.0,
    quantity: 24,
    lowStockThreshold: 5,
  },
  {
    name: "Pallet Jack 5500lb",
    sku: "PJ-5500",
    category: "Equipment",
    description: "Manual pallet jack with 5500 lb capacity.",
    price: 329.5,
    quantity: 6,
    lowStockThreshold: 3,
  },
  {
    name: "Cardboard Box 18x18x16",
    sku: "BOX-181816",
    category: "Packaging",
    description: "Double-wall corrugated cardboard box.",
    price: 2.15,
    quantity: 380,
    lowStockThreshold: 100,
  },
  {
    name: "Stretch Wrap Roll 80ga",
    sku: "WRAP-80GA",
    category: "Packaging",
    description: "Industrial stretch wrap, 18in x 1500ft.",
    price: 14.9,
    quantity: 4,
    lowStockThreshold: 12,
  },
  {
    name: "Forklift Battery 24V",
    sku: "BAT-FL-24V",
    category: "Equipment",
    description: "Replacement 24V deep-cycle forklift battery.",
    price: 1240.0,
    quantity: 2,
    lowStockThreshold: 2,
  },
  {
    name: "Safety Gloves (Pair)",
    sku: "PPE-GLV-01",
    category: "Safety",
    description: "Cut-resistant work gloves, size L.",
    price: 6.25,
    quantity: 145,
    lowStockThreshold: 50,
  },
  {
    name: 'Hi-Vis Vest Class 2',
    sku: "PPE-VEST-2",
    category: "Safety",
    description: "ANSI Class 2 reflective safety vest.",
    price: 11.4,
    quantity: 38,
    lowStockThreshold: 20,
  },
  {
    name: "Shipping Label 4x6",
    sku: "LBL-4X6",
    category: "Packaging",
    description: "Direct thermal shipping labels, roll of 500.",
    price: 8.99,
    quantity: 60,
    lowStockThreshold: 25,
  },
  {
    name: "Bin Divider Small",
    sku: "BIN-DIV-S",
    category: "Storage",
    description: "Small bin divider for parts organization.",
    price: 1.75,
    quantity: 9,
    lowStockThreshold: 30,
  },
  {
    name: "Floor Tape Yellow",
    sku: "TAPE-YEL",
    category: "Safety",
    description: "Heavy-duty floor marking tape, 2in x 108ft.",
    price: 18.5,
    quantity: 17,
    lowStockThreshold: 10,
  },
];

export async function runSeed(): Promise<void> {
  const userCount = await User.countDocuments({});
  let adminId: string | undefined;
  if (userCount === 0) {
    const adminPwd = process.env["SEED_ADMIN_PASSWORD"] || "admin123";
    const viewerPwd = process.env["SEED_VIEWER_PASSWORD"] || "viewer123";
    const admin = await User.create({
      name: "Warehouse Admin",
      email: "admin@warehouse.local",
      passwordHash: await bcrypt.hash(adminPwd, 10),
      role: "admin",
    });
    adminId = String(admin._id);
    await User.create({
      name: "Floor Viewer",
      email: "viewer@warehouse.local",
      passwordHash: await bcrypt.hash(viewerPwd, 10),
      role: "viewer",
    });
    logger.info(
      { admin: "admin@warehouse.local", viewer: "viewer@warehouse.local" },
      "Seeded default users",
    );
  }

  const productCount = await Product.countDocuments({});
  if (productCount === 0) {
    const created = await Product.insertMany(seedProducts);
    logger.info({ count: created.length }, "Seeded products");

    if (!adminId) {
      const admin = await User.findOne({ role: "admin" });
      if (admin) adminId = String(admin._id);
    }
    if (adminId && created.length > 0) {
      const movementsToInsert: Array<{
        product: unknown;
        type: "IN" | "OUT";
        quantity: number;
        note: string;
        user: string;
      }> = [];
      for (const p of created) {
        movementsToInsert.push({
          product: p._id,
          type: "IN",
          quantity: p.quantity,
          note: "Initial stock",
          user: adminId,
        });
      }
      // a few OUT movements to make the dashboard interesting
      const first = created[0];
      const second = created[2];
      if (first) {
        movementsToInsert.push({
          product: first._id,
          type: "OUT",
          quantity: 2,
          note: "Order #1042",
          user: adminId,
        });
      }
      if (second) {
        movementsToInsert.push({
          product: second._id,
          type: "OUT",
          quantity: 25,
          note: "Order #1043",
          user: adminId,
        });
      }
      await Movement.insertMany(movementsToInsert);
      // adjust product quantities for OUT movements
      if (first) {
        await Product.updateOne({ _id: first._id }, { $inc: { quantity: -2 } });
      }
      if (second) {
        await Product.updateOne(
          { _id: second._id },
          { $inc: { quantity: -25 } },
        );
      }
    }
  }
}
