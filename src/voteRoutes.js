import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default function voteRoutes(io) {
  const router = express.Router();

  // Submit a vote
  router.post("/", async (req, res) => {
    try {
      const { userId, optionId } = req.body;

      const vote = await prisma.vote.create({
        data: { userId, optionId },
      });

      // Get pollId for this option
      const option = await prisma.pollOption.findUnique({
        where: { id: optionId },
        include: { poll: true },
      });

      const pollId = option.pollId;

      // Fetch updated options with vote counts
      const updatedOptions = await prisma.pollOption.findMany({
        where: { pollId },
        include: { votes: true },
      });

      // Broadcast real-time update to all clients
      io.emit(`poll_${pollId}`, updatedOptions);

      res.json(vote);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
