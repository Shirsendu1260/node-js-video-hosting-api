import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async (): Promise<void> => { // Promise<void> -> resolves with returning nothing
	try {
		const connInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		// console.log(connInstance);

		console.log(`\nConnected to MongoDB! DB HOST: ${connInstance.connection.host}`);
	}
	catch(error: unknown) {
		if(error instanceof Error) {
			console.error('MONGODB CONNECTION ERROR:', error.message);
		}
		else {
			console.error('MONGODB CONNECTION ERROR:', error);
		}

		process.exit(1); // Status code 1 -> An Uncaught Fatal Exception occurred and was not handled by an uncaughtException handler.
	}
}

export default connectDB;