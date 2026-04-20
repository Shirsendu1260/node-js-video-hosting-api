import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { DATA_LIMIT } from './constants.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import likeRouter from './routes/like.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import commentRouter from './routes/comment.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import postRouter from './routes/post.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';
import reportRouter from './routes/report.routes.js';
import type { Request, Response, NextFunction } from 'express';
import { ApiError } from './utils/ApiError.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';





const app = express();

app.set('trust proxy', 1); // Trust first proxy (proxy/load balancer)

// Above code is the solution for the X-Forwarded-For Error
// When we deploy on any cloud platform (Render, Railway, Vercel etc.), our Express app doesn't sit 
// directly on the internet. There's a proxy/load balancer in front of it:
// 	  Real User (IP: 103.x.x.x) -> Proxy/Load Balancer (sits here) -> Our Express App
// The proxy forwards the request to our app, but the request now appears to come from the proxy's 
// IP, not the user's real IP. To solve this, the proxy adds a special header:
// 	  X-Forwarded-For: 103.x.x.x
// This header says — "hey Express, the real user IP is this, I'm just the middleman."
// Now express-rate-limit sees this header and tries to use it for IP-based rate limiting. But Express's 
// trust proxy setting is false by default, meaning Express says — "I don't trust this header, anyone 
// could fake it."
// express-rate-limit then throws the ValidationError, and because it crashes mid-request, every 
// request fails before reaching our routes, that's why we got 404 on everything including healthcheck.

// Why '1' and not 'true'?
// trust proxy = true -> trusts all proxies in the chain blindly. A malicious user could spoof the 
// X-Forwarded-For header and fake their IP, bypassing rate limiting entirely.
// trust proxy = 1 -> trusts only the first (outermost) proxy. Since Render/Railway's proxy is the 
// first one, it reads that correctly. Any spoofed headers deeper in the chain are ignored.
// This is the secure production-standard setting for any single-proxy deployment.

// Learning:
// This is a very real and common backend concept. In production, our app almost never sits directly 
// on the internet; there's always a proxy, load balancer, or CDN in front. Understanding the proxy 
// chain is important because it affects:
// Rate limiting (IP identification)
// Logging real user IPs
// HTTPS detection (req.secure)
// Geo-location based on IP





/****************************** MIDDLEWARES SETUP ******************************/

// 1. Allow requests from frontend (CORS setup)
app.use(cors({
	origin: process.env.CORS_ORIGIN, // Allowed frontend URL
	credentials: true               // Allow cookies/auth headers
}));

// 2. Parse incoming JSON request bodies (without this req.body would be undefined)
app.use(express.json({
	limit: DATA_LIMIT // Prevent very large payloads
}));

// 3. Parse URL-encoded request bodies
app.use(express.urlencoded({
	extended: true,  // Allow nested objects (without this "user[name]=Shiv" would not parse correctly)
	limit: DATA_LIMIT
}));

// 4. Serve static files directly from "public" folder
app.use(express.static('public'));

// 5. Middleware that can access cookies from user's browser and set cookies in it
//    Reads cookies from incoming HTTP requests (without this "req.cookies" would be undefined)
app.use(cookieParser());

// 6. With rate limiter middleware, restricting client how many max. requests he/she can make to 
//    our API within a time window specified in the middleware
app.use(generalLimiter);





/****************************** ROUTES SETUP ******************************/

///// Routes declaration /////

app.use('/api/v1/user', userRouter); //  /api/v1/ -> API versioning
app.use('/api/v1/video', videoRouter);
app.use('/api/v1/like', likeRouter);
app.use('/api/v1/subscription', subscriptionRouter);
app.use('/api/v1/comment', commentRouter);
app.use('/api/v1/playlist', playlistRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/report', reportRouter);





// 404 response for unknown routes
app.use((req: Request, res: Response) => {
	return res.status(404).json({
		statusCode: 404,
		success: false,
		message: 'Route not found.'
	});
});

// Global error handler (with all 4 parameters for Express to treat it as error handler middleware)
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
	if(err instanceof ApiError) {
		return res.status(err.statusCode).json({
			statusCode: err.statusCode,
			success: false,
			message: err.message,
			errors: err.errors
		});
	}

	// If any unexpected error occurs such as server crashes, unknown bugs etc.
	return res.status(500).json({
		statusCode: 500,
		success: false,
		message: 'Internal Server Error.'
	});
});





export { app };