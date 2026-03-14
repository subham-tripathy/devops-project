const path = require("path");
const express = require("express");
const client = require("prom-client");

const app = express();

// ── Prometheus metrics setup ──────────────────────────────────────────────────
const register = new client.Registry();

// Collect default Node.js metrics (CPU, memory, event-loop lag, etc.)
client.collectDefaultMetrics({ register });

// Custom: count HTTP requests
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Custom: track request duration
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Custom: crash counter
const crashCounter = new client.Counter({
  name: "app_crash_total",
  help: "Total number of times /crash was hit",
  registers: [register],
});

// Middleware: record every request
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const labels = { method: req.method, route: req.path, status_code: res.statusCode };
    httpRequestCounter.inc(labels);
    end(labels);
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Expose Prometheus metrics
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Crash endpoint (to simulate failure)
app.get("/crash", (req, res) => {
  crashCounter.inc();
  console.error("💥 Crash endpoint hit — process exiting");
  process.exit(1);
});

app.listen(3000, () => {
  console.log("App running on port 3000");
  console.log("Metrics available at /metrics");
});
