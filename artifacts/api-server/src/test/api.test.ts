import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import app from "../app";
import { connectDb, disconnectDb } from "../lib/db";

describe("inventory API contracts", () => {
  let token = "";

  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    const register = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@test.local",
      password: "password123",
    });
    token = register.body.token;
  });

  it("accepts frontend sort aliases in product listing", async () => {
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Widget A",
        sku: "WIDGET-A",
        category: "Hardware",
        price: 5.5,
        quantity: 8,
        lowStockThreshold: 2,
      })
      .expect(201);

    const response = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .query({ sort: "name_asc", page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items[0].name).toBe("Widget A");
  });

  it("rejects stock OUT movements that exceed available quantity", async () => {
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Widget B",
        sku: "WIDGET-B",
        category: "Hardware",
        price: 10,
        quantity: 2,
        lowStockThreshold: 1,
      })
      .expect(201);

    const response = await request(app)
      .post("/api/movements")
      .set("Authorization", `Bearer ${token}`)
      .send({
        productId: productRes.body.id,
        type: "OUT",
        quantity: 3,
        note: "Too much",
      })
      .expect(400);

    expect(response.body.message).toMatch(/insufficient stock/i);
  });
});
