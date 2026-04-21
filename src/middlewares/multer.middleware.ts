import multer from 'multer';
import fs from 'fs';
import { UPLOAD_DIR } from '../constants.js';
import type { Request } from 'express';

// By using Multer's file upload middleware, we will save the uploaded file from forms 
// (multipart/form-data) in a specific folder (such as '/tmp/uploads')
// Then we will collect the file from that location and upload it to Cloudinary cloud storage

/*
Multer has two main storage types:
diskStorage -> saves file in a folder in disk
memoryStorage -> keeps file in RAM
*/

// Check if the directory exists or not at startup
if(!fs.existsSync(UPLOAD_DIR)) {
	fs.mkdirSync(UPLOAD_DIR, { recursive: true }); 
	// recursive: true means it won't throw an error if the folder already exists
	// and it will create it if it doesn't
}

// Upload files using DiskStorage engine provided by Multer
const storage = multer.diskStorage({
	/*
	Example file object:
	{
	  fieldname: "avatar", // form's field name
	  originalname: "photo.png",
	  mimetype: "image/png"
	}
	*/

	// This function decides where the uploaded file will be saved
	destination: function (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void
	) { // cb -> callback function
		// cb(null, './public/temp'); // error = null, means No error -> store file in ./public/temp
		cb(null, UPLOAD_DIR); // Render's free tier filesystem is read-only except for /tmp
		
		/*
		When Multer receives a file:
		Client uploads file -> Multer runs destination() -> Calls cb(null, './public/temp') 
		-> Multer saves file there
		*/
	},

	// This decides what the saved file name will be
	filename: function (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, filename: string) => void
	) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // This creates an unique number
		cb(null, file.fieldname + '-' + uniqueSuffix);
	}
});

export const upload = multer({ storage }); // ES6+ shorthand of { storage: storage }