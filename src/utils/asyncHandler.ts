import type { Request, Response, NextFunction, RequestHandler } from "express";

// Type alias for any async Express controller function
// It takes (req, res, next) and returns a Promise
type AsyncControllerFunction = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<void> | Promise<Response> | void; // Promise<Response> -> Resolves to standard JSON response




// // Using try-catch block
// const asyncHandler = (requestHandler) => {
// 	return async (req, res, next) => {
// 		try {
// 			await requestHandler(req, res, next);
// 		}
// 		catch(error) {
// 			// res.status(error.code || 500).json({
// 			// 	success: false,
// 			// 	message: error.message || "Internal Server Error",
// 			// });

// 			// next() -> continue normally
// 			// next(error) -> jump to Express error handler or global error handler

// 			next(error); // Skip normal middleware and forward the error to Express's error-handling middleware or global error handler middleware
// 		}
// 	}
// }






// Using promises
const asyncHandler = (requestHandler: AsyncControllerFunction): RequestHandler => {
	// This returns a new Express middleware function that will be executed in applied routes
	// RequestHandler: this is Express's own built-in type for any middleware/controller function (req, res, next) => void
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));

		/*
		Promise.resolve(requestHandler(req, res, next))
		This runs your controller function.
		Why Promise.resolve()?
		Because controllers may be: async function, normal function
		Promise.resolve() ensures it always behaves like a Promise.
		*/

		/*
		.catch((error) => next(error));
		If any error happens: database error, undefined variable, rejected promise
		it will automatically go to: next(error)
		which triggers Express error middleware or global error handler.
		*/

		// // Without asyncHandler:
		// app.get("/users/:id", async (req, res, next) => {
		//   try {
		//     const user = await User.findById(req.params.id);
		//     res.json(user);
		//   } catch (error) {
		//     next(error);
		//   }
		// });

		// // With asyncHandler:
		// app.get("/users/:id", asyncHandler(async (req, res) => {
		//   const user = await User.findById(req.params.id);
		//   res.json(user);
		// }));

		/*
		Request comes in
		asyncHandler's returned function runs (req, res, next)
		Your original controller runs inside Promise.resolve()
		Success? -> res.json() sends response normally
		Error?   -> .catch() -> next(error) -> Express error middleware or global error handler
		*/

		// asyncHandler wraps async controllers and forwards errors to Express automatically.

		/*
		What it does:
		Calls your original controller:
			requestHandler(req, res, next)
		Wraps whatever it returns into a Promise using:
			Promise.resolve(...)
		Why?
		Because:
		If the function is async -> it already returns a Promise
		If it throws -> it becomes a rejected Promise
		If it's normal -> it becomes a resolved Promise
		So now everything becomes Promise-safe.
		*/
	}
}

export { asyncHandler };