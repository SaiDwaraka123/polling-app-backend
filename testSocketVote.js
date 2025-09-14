// testSocketVote.js

const { io } = require("socket.io-client");
const fetch = require("node-fetch"); // npm i node-fetch@2

const socket = io("http://localhost:4000");

// Join a poll room
const pollId = 3; // change to your poll ID
socket.emit("joinPoll", pollId);

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("voteUpdate", (data) => {
  console.log("Updated poll results:", data);
});

// Example: cast a vote using REST API
async function castVote(userId, pollOptionId) {
  try {
    const res = await fetch("http://localhost:4000/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, pollOptionId }),
    });
    const data = await res.json();
    console.log("Vote response:", data);
  } catch (err) {
    console.error(err);
  }
}

// Example usage: castVote(userId, pollOptionId)
castVote(1, 2); // replace with actual IDs from your DB


//import { io } from "socket.io-client";
//const { io } = require("socket.io-client");
//const fetch from "node-fetch"; // make sure you have node-fetch installed: npm i node-fetch
//const fetch = require("node-fetch");

// const BASE_URL = "http://localhost:4000"; // your backend
// const POLL_ID = 1; // change this to the poll ID you want to test
// const USER_ID = 1; // change to an existing user ID
// const POLL_OPTION_ID = 1; // change to an existing poll option ID

// // 1️⃣ Connect to Socket.IO server
// const socket = io(BASE_URL);

// socket.on("connect", () => {
//   console.log("✅ Connected with ID:", socket.id);

//   // Join the poll room
//   socket.emit("joinPoll", POLL_ID);
//   console.log(`📢 Joined poll ${POLL_ID}`);

//   // Send a vote after joining
//   sendVote(USER_ID, POLL_OPTION_ID);
// });

// // 2️⃣ Listen for live vote updates
// socket.on("voteUpdate", (data) => {
//   console.log("📊 Vote Update Received:", JSON.stringify(data, null, 2));
// });

// // 3️⃣ Function to submit a vote using your REST API
// async function sendVote(userId, pollOptionId) {
//   try {
//     const res = await fetch(`${BASE_URL}/votes`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ userId, pollOptionId })
//     });

//     const data = await res.json();
//     if (res.ok) {
//       console.log("✅ Vote submitted:", data);
//     } else {
//       console.log("❌ Error submitting vote:", data);
//     }
//   } catch (err) {
//     console.error("❌ Fetch error:", err);
//   }
// }
