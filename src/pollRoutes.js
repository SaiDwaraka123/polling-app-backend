import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Create a poll with options
router.post("/", async (req, res) => {
  try {
    const { question, creatorId, options } = req.body;
    const poll = await prisma.poll.create({
      data: {
        question,
        creatorId,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
      include: { options: true },
    });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all polls with their options
router.get("/", async (req, res) => {
  const polls = await prisma.poll.findMany({
    include: { options: true },
  });
  res.json(polls);
});

export default router;
