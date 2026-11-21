import rateLimit from "express-rate-limit";

export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 login/register attempts per 15 min
  message: {
    success: false,
    error: {
      message: "Too many authentication attempts, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30, // max 30 AI analysis requests per 5 min
  message: {
    success: false,
    error: {
      message: "AI analysis rate limit exceeded. Please wait a moment before trying again.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
