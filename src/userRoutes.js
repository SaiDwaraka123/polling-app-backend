import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, passwordHash } = req.body;
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

export default router;
