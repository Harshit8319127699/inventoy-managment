import app from "../artifacts/api-server/src/app";
import { connectDb } from "../artifacts/api-server/src/lib/db";
import { runSeed } from "../artifacts/api-server/src/seed";

let bootstrapPromise: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await connectDb();
      await runSeed();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  await bootstrapPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await bootstrap();
    app(req, res);
  } catch (error) {
    res.status(500).json({
      message: "Server initialization failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
