import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';


const healthcheck = asyncHandler(async (_, res) => {
	return res.status(200).json(
        new ApiResponse(200, {}, 'STATUS: ALL OK')
    );
});


export { healthcheck };