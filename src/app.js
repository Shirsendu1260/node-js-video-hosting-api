import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { DATA_LIMIT } from './constants.js';

const app = express();

// 1. Allow requests from frontend (CORS setup)
app.use(cors({
	origin: process.env.CORS_ORIGIN, // Allowed frontend URL
	credentials: true               // Allow cookies/auth headers
}));

// 2. Parse incoming JSON request bodies (without this "req.body" would be undefined)
app.use(express.json({
	limit: DATA_LIMIT // Prevent very large payloads
}));

// 3. Parse URL-encoded request bodies (from URL, HTML forms etc.)
app.use(express.urlencoded({
	extended: true,  // Allow nested objects (without this "user[name]=Shiv" would not parse correctly)
	limit: DATA_LIMIT
}));

// 4. Serve static files directly from "public" folder
app.use(express.static('public'));

// 5. Middleware that can access cookies from user's browser and set cookies in it
//    Reads cookies from incoming HTTP requests (without this "req.cookies" would be undefined)
app.use(cookieParser());

export { app };