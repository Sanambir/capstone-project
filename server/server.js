const { Server } = require("socket.io");
const express = require("express");

const app = express();
const port = 3002;

// Sample VM data
let vmData = [
  { id: 1, name: "VM 1", cpu: 35, memory: 60, status: "Running" },
  { id: 2, name: "VM 2", cpu: 45, memory: 70, status: "Idle" },
  { id: 3, name: "VM 3", cpu: 85, memory: 90, status: "Critical" },
  { id: 4, name: "VM 4", cpu: 20, memory: 30, status: "Idle" },
  { id: 5, name: "VM 5", cpu: 50, memory: 40, status: "Running" },
];

const server = app.listen(port, () => {
  console.log(`WebSocket server running on http://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

// Send VM data to connected clients
io.on("connection", (socket) => {
  console.log("A client connected");

  // Emit initial data
  socket.emit("vmData", vmData);

  // Simulate real-time updates every 5 seconds
  setInterval(() => {
    vmData = vmData.map((vm) => ({
      ...vm,
      cpu: Math.min(100, Math.max(0, vm.cpu + (Math.random() * 20 - 10))),
      memory: Math.min(100, Math.max(0, vm.memory + (Math.random() * 20 - 10))),
      status:
        vm.cpu > 80 || vm.memory > 80
          ? "Critical"
          : vm.cpu < 50 && vm.memory < 50
          ? "Idle"
          : "Running",
    }));
    socket.emit("vmData", vmData);
  }, 5000);

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});
