import rateLimit from 'express-rate-limit';



// General rate limiter that applies to all routes
// Prevents server abuse
export const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 50, // Limit each IP to 50 requests per 'window' (here, per 15 minutes)
	standardHeaders: 'draft-8', // Sends standard RateLimit headers in response
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: {
		statusCode: 429,
		success: false,
		message: 'Too many requests, please try again after 15 minutes.'
	}
});



// Auth rate limiter that applies to auth routes (sign-up, sign-in etc.)
// Prevent brute-force and account creaton, login spam
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 6, // Limit each IP to 6 requests per 'window' (here, per 15 minutes)
	standardHeaders: 'draft-8', // Sends standard RateLimit headers in response
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: {
		statusCode: 429,
		success: false,
		message: 'Too many requests, please try again after 15 minutes.'
	}
});



// Flow:
// Request comes in from IP 103.21.x.x
// Find or create a record: { ip: "103.21.x.x", count: 0, windowStart: now }
// Increment count: count = 1
// Is (count > limit)? No -> allow request
// Next request -> count = 2 -> Is (count > limit)? No -> allow request
// ...
// count = 51 -> Is (count > limit)? Yes -> block this request -> send 429 response
// Window expires after 15 min -> count resets to 0


// Without rate limiting, anyone can:
// Brute-force our signin endpoint (try 10,000 password combinations)
// Spam our signup endpoint (create thousands of fake accounts)
// Abuse our server with requests and crash it (DoS attack)
// Scrape all our video/user data instantly


// What the response looks like when blocked by rate limiter
// {
//   "statusCode": 429,
//   "success": false,
//   "message": "Too many attempts. Please try again after 15 minutes."
// }
// The response headers will also automatically include:
// RateLimit-Limit: 6
// RateLimit-Remaining: 0
// RateLimit-Reset: 2026-04-19T10:30:00.000Z
// These tell the client exactly when they can retry.


// By default, 'express-rate-limit' stores counts in memory (inside the Node.js process). 
// This is perfectly fine for our portfolio project. But in a real production app 
// with multiple server instances (horizontal scaling), each instance has its own memory, 
// so the counts don't sync. The solution there is a shared store like Redis.


// The in-memory store (what we already have) is perfectly fine for a single-instance deployment 
// on platforms such as Railway, Render etc. They runs our app as one instance, so memory is 
// shared across all requests.
// Redis is only needed when we scale to multiple server instances. We are nowhere near that.