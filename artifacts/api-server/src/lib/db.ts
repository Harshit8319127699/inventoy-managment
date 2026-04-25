import mongoose from "mongoose";
import { logger } from "./logger";

let memoryServerUri: string | null = null;

export async function connectDb(): Promise<string> {
  let uri = process.env["MONGODB_URI"];
  const isProduction = process.env["NODE_ENV"] === "production";

  if (!uri) {
    if (isProduction) {
      throw new Error(
        "MONGODB_URI must be set in production. Refusing to start with in-memory MongoDB.",
      );
    }
    logger.warn(
      "MONGODB_URI not set — starting an embedded in-memory MongoDB. Data will reset on restart. Set MONGODB_URI for persistent storage.",
    );
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create({
      instance: { dbName: "inventory" },
    });
    memoryServerUri = mem.getUri();
    uri = memoryServerUri;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true,
  });

  logger.info("Connected to MongoDB");
  return uri;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
