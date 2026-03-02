import dotenv from 'dotenv';
import connectDB from './db/index.js';

// Load environment variables from .env file into process.env
// This must run before accessing process.env.* anywhere in the app
dotenv.config({ path: './.env' }); // .env is in project's root folder
// dotenv is preloaded via "-r dotenv/config" in the dev script to auto-load .env before this file runs
// So technically this line is not needed

connectDB();






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