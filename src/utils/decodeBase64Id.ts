import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

const getBase64DecodedId = (base64EncodedId: string): string => {
	if(!base64EncodedId) {
        throw new ApiError(400, 'ID is missing.');
    }

    // Convert Base64 string to a Buffer, then to a standard string (utf-8)
    // Using 'base64url' to decode IDs because it safely handles URL-reserved characters (+, /, =) 
    // that standard base64 might cause problem during transmission.
    const decodedId = Buffer.from(base64EncodedId, 'base64url').toString('utf-8');
    // In standard Base64, the = character is used for padding. If a user (or a bot) sends a URL that looks 
    // like .../v/abc=, some browsers or middleware might strip that =, causing Buffer.from() to 
    // produce a garbled string.

    // Check if the decoded video id is a valid mongodb object id or not before querying
    if(!mongoose.Types.ObjectId.isValid(decodedId)) {
        throw new ApiError(400, "Invalid ID format");
    }

    return decodedId;
};

export default getBase64DecodedId;