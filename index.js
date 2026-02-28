const path = require("path");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Crash endpoint (to simulate failure)
app.get("/crash", (req, res) => {
  process.exit(1);
});

app.listen(3000, () => {
  console.log("App running on port 3000");
});
