require("./config/env");

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const studentsRoutes = require("./routes/students");
const classesRoutes = require("./routes/classes");
const statsRoutes = require("./routes/stats");

const app = express();

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "'unsafe-inline'", // Required for inline lucide icon init
      ],
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "'unsafe-inline'",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Charts.js canvas compatibility
}));

// ── CORS — restrict to own origin in production ─────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
app.use(cors({
  origin: ALLOWED_ORIGIN
    ? (origin, cb) => {
        // Allow same-origin requests (no origin header) and configured domain
        if (!origin || origin === ALLOWED_ORIGIN) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      }
    : true, // permissive in dev when ALLOWED_ORIGIN is not set
  credentials: true,
}));

app.use(express.json({ limit: "256kb" }));

// ── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // reduced from 20 for production safety
  message: { error: "Demasiadas tentativas. Espera 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/stats", statsRoutes);

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, {
  setHeaders: (res, filePath) => {
    // Never cache service worker
    if (filePath.endsWith("sw.js")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  },
}));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  // Log error without leaking stack trace to client
  console.error(`[${new Date().toISOString()}] API error: ${err.message}`);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: "Erro de servidor." });
});

module.exports = app;
