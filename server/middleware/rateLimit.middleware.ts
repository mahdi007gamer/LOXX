import rateLimit from "express-rate-limit";

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs (increased from 5000)
  message: { 
    status: "error", 
    message: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفا ۱۵ دقیقه صبر کنید." 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth specific rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // A bit more than 5 to account for potential retries or shared IPs, but still strict
  message: { 
    status: "error", 
    message: "تلاش‌های ناموفق شما زیاد بود. لطفا ۱۵ دقیقه دیگر تلاش کنید." 
  },
  skipSuccessfulRequests: true, // Only count failures
  standardHeaders: true,
  legacyHeaders: false,
});
