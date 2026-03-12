import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => { // 'res' is not used here
	try {
		// cookie-parser gave this access of req.cookies
		// req.cookies? is optional property because cookies might not be available such as in mobile devices
		// Tokens might come from custom headers
		// Using Postman or mobile devices, we send tokens in this way -
		// Authorization: Bearer <token>

		/* Postman/mobile devicess: Whenever user wants to access a protected route or resource, the user agent should send the JWT access token,
		typically in the 'Authorization' header using the 'Bearer' schema. The content of the header should look
		like the following:
		Authorization: Bearer <accessToken> */

		/* Two sources for the token:
		Cookies — browser clients (web apps)
		Authorization header — mobile apps or Postman (Bearer <token>) */
		const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', ''); // Authorization: Bearer abc123 -> Authorization: abc123

		if(!accessToken) {
		    throw new ApiError(401, 'Unauthorized request.');
		}

		// Decodes the token and returns the payload
		const decodedAccessToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);

		// If it passes, means user provided access token and server's access token are same (the user is authorized), 
		// then the access token is captured in 'decodedAccessToken', else it will not be available
		const user = await User.findById(decodedAccessToken?._id).select('-password -refreshToken');

		if(!user) {
			throw new ApiError(401, 'Invalid access token.');
		}

		req.user = user;
		next();

		/* Auth Middleware (verifyJWT) flow:
		Request hits protected route
		verifyJWT middleware runs
		Extracts token from cookie or header
		Verifies token with JWT secret
		Finds user in DB
		Attaches user to req.user
		next() → controller runs */
	}
	catch(error) {
		throw new ApiError(401, error?.message || 'Error while verifying token!')	
	}
});






/*
============================================================
                     JWT - STUDY NOTES
============================================================
*/


/*
============================================================
  WHAT IS JWT?
============================================================

  JWT = JSON Web Token
  - Just a STRING that stores information securely
  - When you log in, server creates this string and gives it to you
  - Next time you make a request, you send this string back
  - Server reads it and knows who you are
  - WITHOUT checking the database every single time
*/


/*
============================================================
  WHAT DOES A JWT LOOK LIKE?
============================================================

  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIxMjM0NTYifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

  3 parts separated by dots:
  
  header . payload . signature
    1         2          3

  1. Header    → Algorithm used to sign the token
  2. Payload   → Your actual data (_id, email, etc.)
  3. Signature → Proof that token wasn't tampered with
*/


/*
============================================================
  PAYLOAD — WHAT'S INSIDE THE TOKEN
============================================================

  The middle part is just Base64 encoded — NOT encrypted.
  Anyone can decode it. So NEVER store passwords in JWT.

  Decoded payload looks like:
  {
      _id: "123456",
      email: "parvati@gmail.com",
      iat: 1716000000,   // issued at (timestamp)
      exp: 1716086400    // expires at (timestamp)
  }
*/


/*
============================================================
  WHAT DOES "SIGNED" MEAN?
============================================================

  Signature is created using your SECRET KEY:
  signature = HMAC(header + payload, SECRET_KEY)

  If someone tampers with the payload (changes _id to someone else's),
  the new signature won't match the actual → server detects it → token rejected.

  Original:  header . payload     . valid_signature    -> correct
  Tampered:  header . new_payload . valid_signature    -> mismatch → rejected
*/


/*
============================================================
  ACCESS TOKEN vs REFRESH TOKEN — WHY TWO TOKENS?
============================================================

                  Access Token          Refresh Token
  Purpose    →    Prove identity        Get a new access token
  Expiry     →    Short (15min–1day)    Long (7–30 days)
  Stored     →    Cookie or memory      Cookie + Database
  Sent with  →    Every request         Only when access token expires

  WHY SHORT EXPIRY ON ACCESS TOKEN?
  → If it gets stolen, attacker has limited time window.
  → Short expiry = less damage if compromised.

  FLOW:
  User logs in
       ↓
  Server gives access token (short life) + refresh token (long life)
       ↓
  User makes requests with access token
       ↓
  Access token expires
       ↓
  User sends refresh token
       ↓
  Server verifies refresh token in DB → token matches → issues new access token
       ↓
  User keeps going without logging in again
*/


/*
============================================================
  HOW JWT WORKS IN THE CODEBASE
============================================================
*/

// STEP 1 — On login, tokens are created
// jwt.sign() creates the token string
// Payload = data stored inside token (_id, email)
// Secret key = used to sign (from .env)
// expiresIn = when the token dies
/*
userSchema.methods.generateAccessJWTToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email },  // payload
        process.env.ACCESS_TOKEN_SECRET_KEY,   // secret key
        { expiresIn: '12h' }                    // expiry
    );
};
*/


// STEP 2 — Tokens sent to user via secure cookies
// Browser stores these cookies automatically
// Browser sends them with every future request to your server
/*
res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(...);
*/


// STEP 3 — User hits a protected route
// verifyJWT middleware intercepts BEFORE the controller runs
// GET /api/v1/users/profile
//       ↓
// verifyJWT runs first
//       ↓
// profileController runs ONLY if verifyJWT passes


// STEP 4 — Middleware extracts and verifies the token
// jwt.verify() does two things:
//   1. Checks signature is valid (token wasn't tampered with)
//   2. Checks token hasn't expired
// If both pass → returns decoded payload
// const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);
// decodedAccessToken = { _id: "123456", email: "parvati@gmail.com", iat: ..., exp: ... }


// STEP 5 — User attached to request object
// Now every controller AFTER this middleware can access req.user
// and know exactly who is making the request
/*
const user = await User.findById(decodedAccessToken?._id).select('-password -refreshToken');
req.user = user;
next(); // Without next(), request hangs forever
*/


/*
============================================================
  WHAT IS AN HTTP HEADER?
============================================================

  HTTP requests have two parts:
  - HEADERS → metadata about the request (like an envelope)
  - BODY    → actual data (like the letter inside)

  Headers are key-value pairs:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Accept: application/json
*/


/*
============================================================
  WHAT IS THE AUTHORIZATION HEADER?
============================================================

  A STANDARD HTTP header specifically for sending credentials.
  The server reads this header to identify who is making the request.

  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*/


/*
============================================================
  WHAT IS "BEARER"?
============================================================

  Bearer = an authentication SCHEME
  Meaning: "The person BEARING (carrying) this token should be given access"

  Format is always:
  Authorization: Bearer <your_token_here>

  Other schemes exist too:
  Authorization: Basic am9objpwYXNzd29yZA==   ← username:password in base64
  Authorization: Bearer eyJhbGc...             ← JWT token  (used here)
  Authorization: ApiKey abc123                 ← API key

  For JWT → Bearer is the standard
*/


/*
============================================================
  WHY TWO WAYS TO SEND THE TOKEN?
============================================================

  const accessToken = req.cookies?.accessToken           // Way 1 — Cookies
      || req.header('Authorization')?.replace('Bearer ', ''); // Way 2 — Header

  Way 1 — Cookies:
  → Used by BROWSERS automatically
  → User visits your web app → browser sends cookies with every request
  → No extra code needed on frontend

  Way 2 — Authorization Header:
  → Used by mobile apps, Postman, or other services
  → They can't use cookies the same way
  → They manually add the header

  In Postman you set:
  Authorization: Bearer eyJhbGc...

  Your code strips "Bearer " and keeps just the token:
  .replace('Bearer ', '')
  "Bearer eyJhbGc..." → "eyJhbGc..."
*/


/*
============================================================
  FULL FLOW — BIG PICTURE
============================================================

  1. POST /sign-in
     Body: { email, password }
              ↓
  2. Server verifies credentials
              ↓
  3. Server creates access token (short life) + refresh token (long life)
              ↓
  4. Tokens sent via cookies in response
              ↓
  5. GET /profile  (protected route)
     Cookie: accessToken=eyJhbGc...  ← sent automatically by browser
              ↓
  6. verifyJWT middleware runs:
     - Extracts token from cookie or Authorization header
     - Verifies signature (not tampered)
     - Checks expiry (not expired)
     - Decodes payload → gets _id
     - Fetches user from DB using _id
     - Attaches user to req.user
              ↓
  7. profileController runs:
     - Uses req.user to get profile data
     - Sends response back to client
*/