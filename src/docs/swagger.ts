import swaggerJSDoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
	definition: {
		openapi: '3.0.0',
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
	        url: 'http://localhost:8000/api/v1',
	        description: 'Local server'
	      },
	      {
	        url: 'https://vhostbackend.onrender.com/api/v1',
	        description: 'Production server'
	      }
	    ],
	    components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		security: [
			{ bearerAuth: [] }
		],
	},
	apis: [
		process.env.NODE_ENV === 'production' 
		? './dist/routes/*.js' // In production, /dist folder serves with .js build files
		: './src/routes/*.ts'
	] // All routes resides here
};

const swaggerSpec = swaggerJSDoc(options);
export { swaggerSpec };