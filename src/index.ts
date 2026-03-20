import "dotenv/config";  // must be FIRST, loads environment variables from .env into process.env before anything else
import connectDB from './db/index.js';
import { app } from './app.js';

// It returns a promise
connectDB()
.then(() => {
    // Listen for any errors emitted by the Express app
    app.on('error', (error: Error) => {
        console.error('APP ERROR:', error);
        process.exit(1);
    });

    // Start the Express server on the specified port
    const PORT = Number(process.env.PORT ?? '8000'); // process.env.PORT always returns string | undefined, never a number
    app.listen(PORT, () => {
        console.log(`Server is listening on PORT ${PORT}`);
    });
})
.catch((error: unknown) => {
    if(error instanceof Error) {
        console.error("MONGODB CONNECTION FAILED:", error.message);
    }
    else {
        console.error("MONGODB CONNECTION FAILED:", error);
    }
});












/*
import mongoose from 'mongoose';
import { DB_NAME } from './constants.js';
import express from 'express';

// Initialize Express
const app = express();

// Immediately Invoked Async Function to handle async/await (IIFE function)
(async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log("Connected to MongoDB successfully");

        // Listen for any errors emitted by the Express app
        app.on('error', (error) => {
            console.error('APP ERROR:', error);
            throw error; // Crash the app
        });

        // Start the Express server on the specified port
        app.listen(process.env.PORT, () => {
            console.log(`Server is listening on port ${process.env.PORT}`);
        });
    } catch (error) {
        // If database connection fails or any error happens above
        console.error('MONGODB CONNECTION ERROR:', error);
        throw error; // Crash the app
    }
})();
*/