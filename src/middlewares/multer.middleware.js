const multer from 'multer';

// By using Multer's file upload middleware, we will save the uploaded file from forms (multipart/form-data) in public/temp folder
// Then we will collect the file from that location and upload it to Cloudinary cloud storage

/*
Multer has two main storage types:
diskStorage → saves file in a folder in disk
memoryStorage → keeps file in RAM
*/

/*
Flow:
Client uploads file -> Express receives request -> Multer middleware runs
-> File saved in ./public/temp -> Route controller executes
*/

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
	destination: function (req, file, cb) { // cb -> callback function
		cb(null, './public/temp'); // error = null, means No error -> store file in ./public/temp

		/*
		When Multer receives a file:
		Client uploads file -> Multer runs destination() -> You call cb(null, './public/temp') 
		-> Multer saves file there
		*/
	},

	// This decides what the saved file name will be
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // This creates a unique number.
		cb(null, file.fieldname + '-' + uniqueSuffix);
	}
});

export const upload = multer({ storage }); // ES6 shorthand of { storage: storage }