class ApiError extends Error {
	constructor(
		statusCode,                         // HTTP status code (e.g., 400, 404, 500)
		message = 'Something went wrong!',  // Error message (default if none provided)
		errors = [],                        // Array of detailed error messages (e.g., validation errors such as "Password is required", "Password must be 8 characters")
		errorStack = ''                     // Optional custom stack trace
	) {
		super(message); 
		// Call the parent "Error" constructor.
		// This initializes the built-in Error properties like:
		//   - message (the error message)
		//   - stack (where the error happened)
		// Since ApiError extends Error, we MUST call super() before using "this".
		// Without this, JavaScript will throw:
		//   "ReferenceError: Must call super constructor before using 'this'"
		// In short: this line makes ApiError behave like a real NodeJS Error.

		this.statusCode = statusCode; 
		// Store HTTP status code for sending proper response

		this.data = null; 
		// Optional field to attach extra data (currently unused to denote an error)

		this.success = false; 
		// Useful for consistent API responses ('false' indicates failure)

		this.errors = errors; 
		// Store additional error details (like validation issues)

		if (errorStack) {
			this.stack = errorStack;
			// If custom stack is provided, use it
		} else {
			Error.captureStackTrace(this, this.constructor);
			// Capture clean stack trace (removes constructor from stack output)
		}
	}
}

export { ApiError };