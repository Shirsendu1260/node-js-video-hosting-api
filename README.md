# Node.js Video Hosting Backend API

A backend API project for a video hosting platform, built with Node.js, Express, TypeScript, and MongoDB. Handles secure JWT authentication, media upload and management, and data aggregation — with a focus on clean structure and maintainable code.

> Inspired by the *Chai aur Backend* series, independently refactored from JavaScript to TypeScript, with Joi validation logic, API rate limiting, custom interfaces & controllers and many more.

---

## Features

- **TypeScript Throughout** — Static typing across the entire codebase with custom interfaces and utility types.
- **JWT Authentication** — Access and refresh token flow with HttpOnly cookie storage.
- **Request Validation** — Joi validation runs before business logic on all form submits.
- **Media Uploads** — Avatars, cover images, and video assets handled via Multer and stored on Cloudinary.
- **MongoDB Aggregations** — Pipelines for subscriber counts, channel stats, videos and many more.
- **Consistent API Responses** — Custom `ApiError` and `ApiResponse` classes for predictable, uniform responses across all endpoints.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x |
| Runtime | Node.js |
| Framework | Express.js 4.x |
| Database | MongoDB (Mongoose) |
| Validation | Joi |
| Cloud Storage | Cloudinary |
| Security | JWT, Bcrypt, Cookie-parser, CORS |

---

## Project Structure

```
src/
├── controllers/     # Route handlers and business logic
├── db/              # Database connection
├── middlewares/     # Auth and Multer file uploads
├── models/          # Mongoose schemas
├── routes/          # Express route definitions
├── utils/           # ApiError, ApiResponse, asyncHandler
├── app.ts           # Express app setup
├── constants.ts     # App constants
└── index.ts         # Server entry point
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance (local or Atlas)
- Cloudinary account

### 1. Clone the repository

```bash
git clone https://github.com/Shirsendu1260/node-js-video-hosting-api.git
cd node-js-video-hosting-api/
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET_KEY=your_access_token_secret
ACCESS_TOKEN_SECRET_KEY_EXPIRY=1d
REFRESH_TOKEN_SECRET_KEY=your_refresh_token_secret
REFRESH_TOKEN_SECRET_KEY_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run in development mode

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
npm start
```

---

## API Reference

**Base URL:** `http://localhost:8000/api/v1`

> Protected routes require a valid JWT via HttpOnly cookie or `Authorization: Bearer <token>` header.

### Response Format

All endpoints return a consistent structure.

**Success**
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "User fetched successfully.",
  "success": true
}
```

**Error**
```json
{
  "statusCode": 401,
  "message": "Unauthorized request.",
  "success": false,
  "errors": []
}
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Nodemon |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |

---

## Developed By

**Shirsendu Mali**  
📍 Kolkata, India  
Backend Development · Node.js · TypeScript