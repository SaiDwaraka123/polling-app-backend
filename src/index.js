require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Socket.io: join/leave poll rooms
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinPoll', (pollId) => {
    socket.join(`poll_${pollId}`);
    console.log(`${socket.id} joined poll_${pollId}`);
  });

  socket.on('leavePoll', (pollId) => {
    socket.leave(`poll_${pollId}`);
    console.log(`${socket.id} left poll_${pollId}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

/**
 * USERS
 */
// Create user
app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true }
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// List users
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  res.json(users);
});

/**
 * POLLS
 */
// Create poll (with options)
app.post('/polls', async (req, res) => {
  try {
    const { question, options, creatorId, isPublished } = req.body;
    if (!question || !Array.isArray(options) || options.length < 1 || !creatorId) {
      return res.status(400).json({ error: 'question, options (array), creatorId required' });
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished: !!isPublished,
        creator: { connect: { id: creatorId } },
        options: { create: options.map(text => ({ text })) }
      },
      include: { options: true }
    });

    res.json(poll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// List polls with options and vote counts
app.get('/polls', async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      include: {
        creator: { select: { id: true, name: true } },
        options: { include: { _count: { select: { votes: true } } } }
      }
    });

    // map options to include vote counts
    const mapped = polls.map(p => ({
      id: p.id,
      question: p.question,
      isPublished: p.isPublished,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      creator: p.creator,
      options: p.options.map(o => ({ id: o.id, text: o.text, votes: o._count.votes }))
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Get single poll by id
app.get('/polls/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        options: { include: { _count: { select: { votes: true } } } }
      }
    });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const mapped = {
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      creator: poll.creator,
      options: poll.options.map(o => ({ id: o.id, text: o.text, votes: o._count.votes }))
    };
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

/**
 * VOTES
 */
// Submit a vote (single choice per poll enforced)
app.post('/votes', async (req, res) => {
  try {
    const { userId, pollOptionId } = req.body;
    if (!userId || !pollOptionId) return res.status(400).json({ error: 'userId and pollOptionId required' });

    // find the option (and poll id)
    const option = await prisma.pollOption.findUnique({
      where: { id: pollOptionId }
    });
    if (!option) return res.status(404).json({ error: 'Poll option not found' });

    // confirm user hasn't already voted in this poll
    const existing = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: { pollId: option.pollId } // checks vote where related option belongs to same poll
      }
    });
    if (existing) return res.status(400).json({ error: 'User has already voted in this poll' });

    // create vote
    const vote = await prisma.vote.create({
      data: {
        user: { connect: { id: userId } },
        pollOption: { connect: { id: pollOptionId } }
      }
    });

    // compute updated counts for the poll
    const options = await prisma.pollOption.findMany({
      where: { pollId: option.pollId },
      include: { _count: { select: { votes: true } } }
    });
    const results = options.map(o => ({ id: o.id, text: o.text, votes: o._count.votes }));

    // broadcast updated results to sockets joined to this poll
    io.to(`poll_${option.pollId}`).emit('voteUpdate', { pollId: option.pollId, results });

    res.json({ voteId: vote.id, pollId: option.pollId, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

/* start server */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
