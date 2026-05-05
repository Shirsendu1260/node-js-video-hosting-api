import swaggerJSDoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
	definition: {
		openapi: '3.0.0', // standard format for describing APIs
		info: {
			title: 'Video Hosting Backend API',
			version: '1.0.0',
			description: `
			Backend API for a video hosting platform.
  			Features include JWT authentication, video & image upload in Cloudinary, Rate Limiting, RBAC, consistent response structures, content reporting, and many more.

			Protected routes require JWT.
			It is authorized using:
			- Bearer token in Authorization header
			- Or, HttpOnly cookies (browser)`,
		},
		servers: [
	      {
	        url: process.env.NODE_ENV === 'production' 
	        		? 'https://vhostbackend.onrender.com/api/v1'
	        		: 'http://localhost:8000/api/v1',
	        description: process.env.NODE_ENV === 'production' 
			        		? 'Production server'
			        		: 'Local server',
	      }
	    ],
	    components: {
			securitySchemes: { // Tells how authentication works
				bearerAuth: {
					type: 'http', // HTTP auth
					scheme: 'bearer', // Bearer token
					bearerFormat: 'JWT', // JWT format
				} // Generates Authorize button in Swagger UI, User can paste: Bearer <token>
			},
		},
		// security: [
		// 	{ bearerAuth: [] }
		// ], // All routes require authentication via JWT by default
	},
	apis: [
		process.env.NODE_ENV === 'production' 
		? './dist/routes/*.js' // In production, /dist folder serves with .js build files
		: './src/routes/*.ts'
	] // All routes resides here
};

const swaggerSpec = swaggerJSDoc(options); // converts everything into OpenAPI JSON object
export { swaggerSpec };





// Flow:
// Our JSDoc comments in routes
// swagger-jsdoc reads them
// Generates OpenAPI JSON
// Swagger UI displays it at /api-docs

// So this file is translator + config