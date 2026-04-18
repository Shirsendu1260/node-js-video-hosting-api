import mongoose from 'mongoose';
import type { Document, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from "ms";
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';




/******** INTERFACES & TYPES ********/

// Declare the data structure (exact fields defined in schema) for each User document
interface IUser {
	watchHistory: mongoose.Types.ObjectId[],
	fullName: string,
	username: string,
	email: string,
	gender: 'M' | 'F' | 'O', // literal union type, only these 3 values allowed
	avatar: string,
	coverImage?: string,
	password: string,
	refreshToken?: string,
	isAdmin: boolean
}

// Declare the instance methods added to each User document (later will be defined with userSchema.methods) 
interface IUserMethods {
	isPasswordCorrect(password: string): Promise<boolean>,
	generateAccessJWTToken(): Promise<string>,
	generateRefreshJWTToken(): Promise<string>
}

// Construct the complete type of User document by combining multiple types into one.
// IUser -> data structure with the declared fields
// IUserMethods -> with custom methods
// Document -> built-in Mongoose fields like _id, createdAt, updatedAt, save(), etc.
type UserDocument = IUser & IUserMethods & Document;

// Constrct the User model type using Mongoose's built-in type for a model 
// which gives UserDocument data for User.findById(), User.findOne(), User.create(), etc.
type UserModel = Model<UserDocument>;




/******** SCHEMA ********/

// Pass UserDocument as generic to Schema to tell document have the shape of UserDocument
const userSchema = new mongoose.Schema<UserDocument, UserModel>({
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
		match: /.+\@.+\..+/,
		unique: true,
		lowercase: true,
		trim: true
	},
	gender: {
		type: String,
		required: true,
		enum: ['M', 'F', 'O'],
		description: "'M' -> 'Male', 'F' -> 'Female', 'O' -> 'Others'"
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
	},
	isAdmin: {
		type: Boolean,
    required: true,
    default: false
	}
}, { timestamps: true });

// pre(), a middleware hook, runs right before a document is saved.
userSchema.pre('save', async function() { // function(next) is used (not an arrow) because 'this' must reference the MongoDB document to be created/updated.
	// If the password was modified, it hashes it with bcrypt.hash(password, 10) where 10 is the salt rounds.
	if(!this.isModified('password')) return;
	this.password = await bcrypt.hash(this.password, SALT_ROUNDS || 10);
});




/******** INSTANCE METHODS ********/

userSchema.methods.isPasswordCorrect = async function(password: string): Promise<boolean> {
	return await bcrypt.compare(password, this.password); // returns true/false by resolving promise
	// 'this' inside methods automatically becomes UserDocument because of the generics passed to Schema<UserDocument, UserModel>
};

// NOTE: JWT is a bearer token, means what it bears we consider it true and accepts
// Short reminder: Bearer tokens grant whatever permissions the token contains. 
// 		 Protect them (use HTTPS, store securely).

/*
Access Token:
Short-lived (like 15 min).
Sent with every protected request.
Proves the user is logged in.
If stolen, damage is limited (because it expires fast).
Used to access APIs.

Refresh Token:
Long-lived (like 7 days).
Used to generate a new access token.
Not sent on every request.
Stored more securely.
Used to get a new access token when it expires.

Simple analogy:
Access token = Entry pass
Refresh token = Pass renewal card
*/

userSchema.methods.generateAccessJWTToken = async function(): Promise<string> {
	// The payload (data to be embedded)
	const payload = {
		_id: this._id, // At this point, document is saved, so we have the access of its unique id
		email: this.email,
		username: this.username,
		fullName: this.fullName
	};
	/* JWT payload is not encrypted
	It is only signed
	Anyone can decode it (but cannot modify it without breaking signature)
	So don’t put: passwords, sensitive secrets (it's base64 encoded and easily readable). */

	// This is the signature key. It ensures token cannot be modified
	const secretKey = process.env.ACCESS_TOKEN_SECRET_KEY; // string | undefined at this stage
	if (!secretKey) throw new ApiError(500, "ACCESS_TOKEN_SECRET_KEY is not defined."); // if undefined
	const secret: Secret = secretKey; // now safe to assign, guaranteed string

	// Sign options for signature creation
	const signOptions: SignOptions = { // Default algo: HS256 (HMAC using SHA-256 hash algorithm)
		expiresIn: (process.env.ACCESS_TOKEN_SECRET_KEY_EXPIRY || '12h') as StringValue // How long token is valid ("15m", "1h", "7d")		
	}

	return jwt.sign(payload, secret, signOptions);
};

userSchema.methods.generateRefreshJWTToken = async function(): Promise<string> {
	const payload = { _id: this._id };

	const secretKey = process.env.REFRESH_TOKEN_SECRET_KEY;
	if (!secretKey) throw new ApiError(500, "REFRESH_TOKEN_SECRET_KEY is not defined.");
	const secret: Secret = secretKey;

	const signOptions: SignOptions = {
		expiresIn: (process.env.REFRESH_TOKEN_SECRET_KEY_EXPIRY || '7d') as StringValue
	};

	return jwt.sign(payload, secret, signOptions);
};

/*
JWT (JSON Web Token)

Structure:
HEADER.PAYLOAD.SIGNATURE

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOjEyMywiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c


1. Header
Info about token type and algorithm.
{ "alg": "HS256", "typ": "JWT" }

2. Payload
Actual data (claims).
{ "userId": 123, "email": "user@example.com" }

3. Signature
Created using (for example):
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)

Purpose:
- verifies the token is authentic
- ensures header/payload were not modified
*/




/********MODEL ********/

export const User = mongoose.model<UserDocument, UserModel>('User', userSchema);
// UserModel  ->  the tool used to query database (User.findById, User.create etc.)
// UserDocument  ->  the actual single user object returned from database

export type { UserDocument, UserModel };