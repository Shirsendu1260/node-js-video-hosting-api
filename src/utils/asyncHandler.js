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
// 			// next(error) -> jump to Express error handler

// 			next(error); // Skip normal middleware and forward the error to Express's error-handling middleware
// 		}
// 	}
// }

// Using promises
const asyncHandler = (requestHandler) => {
	// This returns a new Express middleware function that will be executed in applied routes
	return (req, res, next) => {
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
		which triggers Express error middleware.
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
		Client Request -> Express Route -> asyncHandler(controller) -> controller executes
		-> Error occurs? -> catch() -> next(error) -> Express Error Middleware
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










/*
const asyncHandler = () => {} // Normal arrow function
const asyncHandler = (func) => {} // Higher order function, takes a function as input (usually to wrap async functions)
const asyncHandler = (func) => () => {} // Higher order function, takes a function as input and returns another function
*/

/*
Above is same as this ----
function asyncHandler(func) {
  return func() {};
}
and this ----
const asyncHandler = (func) => {
	return () => {}
}
*/

/*
const asyncHandler = (func) => {
	// Extracting 'req', 'res', 'next' from the provided function 'func' and passing them to the async function
	return async (req, res, next) = {

	}
}
*/

/*
So asyncHandler:
Takes your original function
Returns a new function that Express will actually call
It’s a wrapper.
*/

/*
Why would someone do this?
Because in frameworks like Express, you often want:
You give it your original route function
It returns a new wrapped function
That wrapped function runs your original one (with error handling, logging, etc.)
It’s just a wrapper.
*/

/*
asyncHandler is basically:
“Run this controller function. If it suceeds, fine; but if it fails, don’t crash — pass the error to Express.”
*/