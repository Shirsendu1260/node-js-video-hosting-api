import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import type { UploadApiResponse, UploadApiOptions } from "cloudinary"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Return "https" URLs by setting secure: true
});

// Upload file
const cloudinaryUploader = async (
  localFilePath: string,
  subFolder: string
): Promise<UploadApiResponse | null> => {
	try {
		if(!localFilePath) return null;

    // Use the uploaded file's name as the asset's public ID (unique identifier of the uploaded file) and 
    // allow overwriting the asset with new versions
    const options: UploadApiOptions = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      resource_type: 'auto', // Automatically determine filetype
      folder: 'node-video-hosting-backend-uploads/' + subFolder
    };

    // Upload the local file from server to Cloudinary cloud storage
    const uploadResult = await cloudinary.uploader.upload(localFilePath, options);
    fs.unlinkSync(localFilePath); // Remove (unlink) the saved temporary file from our local server storage
    console.log('UPLOAD SUCCESSFUL ON CLOUDINARY. SOURCE:', uploadResult.secure_url);

    // Example of 'uploadResult'
    /*
    {
      "asset_id": "abc123xyz",
      "public_id": "sample_image",
      "version": 1700000000,
      "width": 800,
      "height": 600,
      "format": "jpg",
      "resource_type": "image",
      "created_at": "2026-03-05T10:00:00Z",
      "bytes": 345678,
      "url": "http://res.cloudinary.com/demo/image/upload/sample_image.jpg",
      "secure_url": "https://res.cloudinary.com/demo/image/upload/sample_image.jpg" // HTTPS URL of uploaded file
    }
    */

    return uploadResult;
  }
	catch(error: unknown) {
    if(error instanceof Error) {
      console.log('CLOUDINARY UPLOAD ERROR:', error.message);
    }
    else {
      console.log('CLOUDINARY UPLOAD ERROR:', error);  
    }
    
    // Check if file exists before trying to delete it
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath)
    }

    return null;
	}
};

export { cloudinaryUploader };