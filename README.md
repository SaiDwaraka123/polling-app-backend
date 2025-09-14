# Move37 Ventures Polling App Backend

## Project Overview
This is the backend for a **Real-Time Polling Application** built as part of the Move37 Ventures Backend Developer Challenge.  
It allows users to create polls, vote on them, and receive live updates on poll results via WebSockets.

Technologies used:
- **Backend Framework:** Node.js with Express.js
- **Database:** MySQL 
- **ORM:** Prisma
- **Real-time Communication:** Socket.IO (WebSockets)

---

## Features
- Create and retrieve users
- Create polls with multiple options
- Submit votes for poll options (one vote per user per poll)
- Live updates of poll results via WebSockets

---

## Database Schema (Prisma)

**User**
- id
- name
- email
- passwordHash

**Poll**
- id
- question
- isPublished
- createdAt
- updatedAt
- creatorId (relation to User)

**PollOption**
- id
- text
- pollId (relation to Poll)

**Vote**
- id
- userId (relation to User)
- pollOptionId (relation to PollOption)

**Relationships**
- One-to-Many: User → Poll, Poll → PollOption
- Many-to-Many: User ↔ PollOption through Vote

---

## Installation

1. Clone the repository
```bash
git clone https://github.com/YourUsername/move37-polling-app-backend.git

install dependencies

npm install

Create a .env file in the root directory with your database credentials
DATABASE_URL="mysql://user:password@localhost:3306/polling_app"
PORT=4000

Run Prisma migrations
npx prisma migrate dev --name init

Start the server
npm run dev

The backend server will start on http://localhost:4000.

API Endpoints
Users
POST /users – Create a new user
Request body: { "name": "John", "email": "john@example.com", "password": "1234" }

GET /users – Get all users
Polls
POST /polls – Create a poll
Request body: { "question": "Your question", "options": ["Option1", "Option2"], "creatorId": 1, "isPublished": true }

GET /polls – Get all polls with options and vote counts

GET /polls/:id – Get a single poll by ID
Votes
POST /votes – Submit a vote
Request body: { "userId": 1, "pollOptionId": 2 }

WebSocket (Real-Time Updates)
Connect to the server using Socket.IO client
const socket = io("http://localhost:4000");

Join a poll room
socket.emit("joinPoll", pollId);

Leave a poll room
socket.emit("leavePoll", pollId);

Receive live vote updates
socket.on("voteUpdate", (data) => {
  console.log(data);
});
