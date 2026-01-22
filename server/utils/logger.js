const winston = require("winston");
const path = require("path");
const fs = require("fs");

const isProd = process.env.NODE_ENV === "production";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transports array
const transports = [];

// ✅ File logging ONLY in non-production
if (!isProd) {
  const logsDir = path.join(__dirname, "../logs");

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

// ✅ Console logging (ALWAYS in prod)
transports.push(
  new winston.transports.Console({
    format: isProd ? logFormat : consoleFormat,
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "resume-evaluator" },
  transports,
});

// Morgan stream
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
