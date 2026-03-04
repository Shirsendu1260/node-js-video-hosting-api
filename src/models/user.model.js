import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	watchHistory: [ // Array of ObjectId's of Video model
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Video'
		}
	],
	fullName: {
		type: String,
		required: [true, 'Fullname is required'],
		trim: true,
		index: true
	},
	username: {
		type: String,
		required: [true, 'Username is required'],
		unique: true,
		lowercase: true,
		trim: true, // "  maa " → "maa"
		index: true // Creates a database index on this field to improve query performance (adds faster reads but slightly slower writes and index consumes extra spaces too)
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true,
		lowercase: true,
		trim: true
	},
	gender: {
		type: String,
		required: true,
		enum: ['M', 'F', 'O'],
		description: "'M' -> 'Male', 'F' -> 'Female', 'O' -> 'Other'"
	},
	avatar: {
		type: String, // Cloudinary uploaded image's URL
		required: [true, 'Avatar is required']
	},
	coverImage: {
		type: String // Cloudinary uploaded image's URL
	},
	password: {
		type: String, // Stores encryted password text
		required: [true, 'Password is required']
	},
	refreshToken: {
		type: String
	}
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);