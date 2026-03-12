import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../constants.js';

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
	}
}, { timestamps: true });

// pre(), a middleware hook, runs right before a document is saved.
userSchema.pre('save', async function(next) { // function(next) is used (not an arrow) because 'this' must reference the MongoDB document to be created/updated.
	// If the password was changed, it hashes it with bcrypt.hash(password, 10) where 10 is the salt rounds.
	if(!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.isPasswordCorrect = async function(password) {
	return await bcrypt.compare(password, this.password); // returns true/false
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

userSchema.methods.generateAccessJWTToken = async function() {
	// jwt.sign(payload, secret, options)
	return await jwt.sign(
		/*
		This is the data stored inside the token.
		Important:
		JWT payload is not encrypted
		It is only signed
		Anyone can decode it (but cannot modify it without breaking signature)

		So don’t put: passwords, sensitive secrets (it's base64 encoded and easily readable).

		We re putting:
		_id -> main thing needed to identify user
		email, username, fullName -> optional convenience data
		*/
		{
			_id: this._id, // At this point, document is saved, so we have the access of its unique id
			email: this.email,
			username: this.username,
			fullName: this.fullName
		},

		/*
		This is the signature key.
		It ensures:
		Token cannot be modified
		Server can verify it was issued by you
		If this leaks -> attackers can generate valid tokens.
		*/
		process.env.ACCESS_TOKEN_SECRET_KEY,

		/*
		This controls how long token is valid.
		Example values:
		"15m", "1h", "7d"
		After expiry: Token becomes invalid, user must use refresh token to issue a new access token
		*/
		{
			expiresIn: process.env.ACCESS_TOKEN_SECRET_KEY_EXPIRY
		}
	);
};

userSchema.methods.generateRefreshJWTToken = async function() {
	return await jwt.sign(
		// Payload
		{
			_id: this._id, // At this point, document is saved, so we have the access of its unique id
		},

		process.env.REFRESH_TOKEN_SECRET_KEY,

		// Expiry
		{
			expiresIn: process.env.REFRESH_TOKEN_SECRET_KEY_EXPIRY
		}
	);
};

/*
Same concept but usually longer-lived and signed with a different secret.
You can (optionally) store the refresh token (or a hashed version) in user.refreshToken in DB for revocation.
Recommendation: store a hashed refresh token in DB (so if DB leaks, raw tokens aren’t exposed), or use rotating refresh tokens.
*/

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
Created using:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)

Purpose:
- verifies the token is authentic
- ensures header/payload were not modified
*/

export const User = mongoose.model('User', userSchema);