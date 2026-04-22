import { Router, type IRouter } from "express";
import authRouter from "./auth";
import productsRouter from "./products";
import movementsRouter from "./movements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/movements", movementsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
