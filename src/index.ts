import "dotenv/config";  // must be FIRST, loads environment variables from .env into process.env before anything else
import connectDB from './db/index.js';
import { app } from './app.js';

// It returns a promise
connectDB()
.then(() => {
    // Start the Express server on the specified port
    // app.listen returns a Node.js http.Server instance
    const PORT = Number(process.env.PORT ?? '8000'); // process.env.PORT always returns string | undefined
    const server = app.listen(PORT, () => {
        console.log(`Server is listening on PORT ${PORT}`);
    });

    // Listen for any errors (Node system errors or standard JS errors) emitted by server
    server.on('error', (error: NodeJS.ErrnoException | Error) => {
        console.error('SERVER ERROR:', error);
        process.exit(1);
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