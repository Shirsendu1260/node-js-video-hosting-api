# Node.js Video Hosting Backend API

A backend REST API project for a video hosting platform, similar to YouTube in terms of core features. Built with Node.js, Express, TypeScript, and MongoDB.

This started as part of the *Chai aur Backend* series, and I extended it significantly from there; migrated the whole codebase from JavaScript to TypeScript, added Joi validation, a content reporting feature, comment likes, role-based access control, rate limiting, and a few other things I felt were missing.

---

## What's in it

- **JWT Auth** — access + refresh token flow, stored in HttpOnly cookies. Also supports `Authorization: Bearer` header for Postman, other API clients, mobile devices etc.
- **TypeScript** — not just surface-level. Custom interfaces, utility types, declaration merging for `req.user`, proper typing on Mongoose models & documents.
- **Joi Validation** — runs before business logic on all write endpoints. Returns all field-level errors as an array, not just the first one.
- **RBAC** — admin flag on users with a middleware that blocks non-admins from admin routes.
- **Rate Limiting** — general limiter (25 req. / 15 min) applied globally, stricter auth limiter (6 req. / 15 min) on signin, signup, and token refresh.
- **Cloudinary** — avatar, cover image, video uploads via Multer. Old files get deleted from Cloudinary when updated or removed.
- **MongoDB Aggregations** — used for subscriber counts, channel stats, watch history, paginated video feeds, and text search with title/description weighting.
- **Content Reporting** — users can report videos and posts, admins can review and update report statuses.
- **Consistent responses** — custom `ApiError` and `ApiResponse` classes so every endpoint returns the same JSON structure.

---

## Tech Stack

| | |
| Language | TypeScript 5.x |
| Runtime | Node.js |
| Framework | Express.js 4.x |
| Database | MongoDB |
| ODM | Mongoose |
| Validation | Joi |
| Storage | Cloudinary |
| Auth & Security | JWT, Bcrypt, CORS, Cookie-parser, Express Rate Limit |

---

## Folder Structure

```
src/
├── controllers/     # business logic for each feature
├── db/              # MongoDB connection
├── middlewares/     # auth (JWT), multer, rate limiter
├── models/          # Mongoose schemas + TS interfaces
├── routes/          # route definitions
├── utils/           # ApiError, ApiResponse, asyncHandler, cloudinary helpers
├── app.ts           # Express setup, applied middlewares, error handlers
├── constants.ts     # shared constants
└── index.ts         # entry point
```

---

## Setup

**Requirements:** Node.js v18+, a MongoDB instance (local or cloud), Cloudinary account

```bash
git clone https://github.com/Shirsendu1260/node-js-video-hosting-api.git
cd node-js-video-hosting-api
npm install
```

Create a `.env` file in the root:

```env
PORT=8000
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=your_frontend_url

ACCESS_TOKEN_SECRET_KEY=your_secret
ACCESS_TOKEN_SECRET_KEY_EXPIRY=1d
REFRESH_TOKEN_SECRET_KEY=your_secret
REFRESH_TOKEN_SECRET_KEY_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
npm run dev       # development server
npm run build     # compile TS to JS
npm start         # run compiled build
```

---

## API Base URL

```
http://localhost:8000/api/v1
```

Protected routes need a valid JWT — either via HttpOnly cookie (browser) or `Authorization: Bearer <token>` header (Postman, other API clients, mobile devices etc.).

**Success response**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success!",
  "success": true
}
```

**Error response**
```json
{
  "statusCode": 400,
  "message": "Validation failed.",
  "success": false,
  "errors": [{ "fieldName": "error message" }]
}
```

---

## Developed by

**Shirsendu Mali** — Kolkata, India  
Backend Development · Node.js · TypeScript · Express · MongoDB