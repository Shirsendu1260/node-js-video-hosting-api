interface IErrorMessage {
	[key: string]: string; // key can be ANY string // value must be a string
} 

class ApiError extends Error {
	// Declare all custom properties with their types
	// 'Error' (the parent) already has 'message' and 'stack' declared, so we don't redeclare those
	public statusCode: number;
	public data: null;
	public success: boolean;
	public errors: IErrorMessage[];

	constructor(
		statusCode: number, // HTTP status code (e.g., 400, 404, 500)
		message: string = 'Something went wrong!', // Error message (default if none provided)
		errors: IErrorMessage[] = [], // Array of detailed error message objects (e.g., validation errors such as "Password is required", "Password must be 8 characters")
		errorStack: string = '' // Optional custom stack trace
	) {
		super(message); 
		// Call the parent "Error" constructor.
		// This initializes the built-in Error properties like:
		//   - message (the error message)
		//   - stack (where the error happened)
		// Since ApiError extends Error, we MUST call super() before using "this".
		// Without this, TS will throw:
		//   "ReferenceError: Must call super constructor before using 'this'"
		// In short: this line makes ApiError behave like a real NodeJS Error.

		this.message = message;
		this.statusCode = statusCode;
		this.data = null; // Field to attach extra data (currently unused to denote an error)
		this.success = false; // Useful for consistent API responses ('false' indicates failure)
		this.errors = errors;

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
export type { IErrorMessage };