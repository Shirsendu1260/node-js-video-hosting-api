import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
	try {
		const connInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
		// console.log(connInstance);

		console.log(`\nConnected to MongoDB! DB HOST: ${connInstance.connection.host}`);
	}
	catch(error) {
		console.error('MONGODB CONNECTION ERROR:', error);
		process.exit(1); // Status code 1 -> An Uncaught Fatal Exception occurred and was not handled by an uncaughtException handler.
	}
}

export default connectDB;