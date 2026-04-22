import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { signToken } from "../lib/auth";
import { requireAuth, requireRole } from "../middlewares/auth";
import { HttpError } from "../middlewares/error";

const router: IRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "viewer"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(u: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
}) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role };
}

// Register: first-ever user becomes admin automatically; afterwards only an
// admin may create new users (and choose their role).
router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const userCount = await User.countDocuments({});
    let role: "admin" | "viewer" = body.role ?? "viewer";

    if (userCount === 0) {
      role = "admin";
    } else {
      // Subsequent registrations require admin auth
      const header = req.headers.authorization;
      if (!header) {
        throw new HttpError(
          401,
          "Only an admin can create new users after the first signup.",
        );
      }
      // Lazy verify
      const { verifyToken } = await import("../lib/auth");
      const token = header.replace(/^Bearer\s+/, "");
      try {
        const payload = verifyToken(token);
        if (payload.role !== "admin") {
          throw new HttpError(403, "Only admins can create users");
        }
      } catch (e) {
        if (e instanceof HttpError) throw e;
        throw new HttpError(401, "Invalid token");
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role,
    });
    const token = signToken({
      sub: String(user._id),
      email: user.email,
      role: user.role as "admin" | "viewer",
      name: user.name,
    });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) throw new HttpError(401, "Invalid credentials");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");
    const token = signToken({
      sub: String(user._id),
      email: user.email,
      role: user.role as "admin" | "viewer",
      name: user.name,
    });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  const u = req.user!;
  res.json({
    user: { id: u.sub, name: u.name, email: u.email, role: u.role },
  });
});

router.get("/users", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      items: users.map((u) =>
        publicUser({ _id: u._id, name: u.name, email: u.email, role: u.role }),
      ),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
