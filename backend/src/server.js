require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 5000;

const authRoute = require("./routes/auth");
const contactRoute = require("./routes/contacts");
const Contact = require("./models/Contact");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// MiddleWares
app.use(express.json());
app.use(cors());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/contactmanager")
  .then(() => {
    console.log("Connected To DB");
  })
  .catch((err) => {
    console.log(err);
  });

// Routes
app.use("/api/auth", authRoute);
app.use("/api/contacts", contactRoute);

// Socket io
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);
  socket.on("lockContact", async ({ contactId, userId }) => {
    try {
      const contact = await Contact.findById(contactId);
      if (contact && !contact.lockedBy) {
        contact.lockedBy = userId;
        contact.lockedAt = new Date();
        await contact.save();
        io.emit("contactLocked", {
          contactId,
          userId,
          lockedAt: contact.lockedAt,
        });
      } else if (
        contact &&
        contact.lockedBy &&
        contact.lockedBy.toString() !== userId
      ) {
        socket.emit("contactAlreadyLocked", {
          contactId,
          lockedBy: contact.lockedBy.toString(),
        });
      }
    } catch (err) {
      console.log("Error edit contact: ", err);
    }
  });
  socket.on("unlockContact", async ({ contactId, userId }) => {
    try {
      const contact = await Contact.findById(contactId);
      if (
        contact &&
        contact.lockedBy &&
        contact.lockedBy.toString() === userId
      ) {
        contact.lockedAt = null;
        contact.lockedBy = null;
        await contact.save();
        io.emit("contactUnlocked", { contactId });
      }
    } catch (err) {
      console.log("Error unlock Contact: ", err);
    }
  });
  socket.on("disconnect", () => {
    console.log("User diconnected: ", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
