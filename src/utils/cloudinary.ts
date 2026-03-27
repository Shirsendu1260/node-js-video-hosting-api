import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import type { UploadApiResponse, UploadApiOptions } from "cloudinary";

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

    const options: UploadApiOptions = {
      use_filename: true, // Use original filename as public_id (unique identifier of the uploaded file)
      unique_filename: false, // Don't append random suffix to filename
      overwrite: true, // Overwrite if same filename already exists
      resource_type: "auto", // Auto-detect file type (image, video, raw)
      chunk_size: 5000000, // 5MB per chunks (Ideal for slow connections)
      timeout: 60000, // 60s timeout
      folder: 'node-video-hosting-backend-uploads/' + subFolder
    };

    // Upload the local file from server to Cloudinary cloud storage
    // upload_large automatically splits files into chunks.
    // If a 5MB chunk fails, it only retries that chunk, not the whole file.
    const uploadResult = await cloudinary.uploader.upload_large(localFilePath, options) as UploadApiResponse;
    fs.unlinkSync(localFilePath); // Remove (unlink) the saved temporary file from our local server storage
    console.log('UPLOAD SUCCESSFUL ON CLOUDINARY. SOURCE:', uploadResult.secure_url);

    // Example of 'uploadResult' if type is 'UploadApiResponse'
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

// Delete uploaded file
const cloudinaryDeleter = async (cloudinaryImgUrl: string): Promise<boolean> => {
  try {
    if(!cloudinaryImgUrl) return false;

    // Extract public_id from the Cloudinary URL
    // URL example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/subfolder/filename.jpg
    
    const indexOfUpload = cloudinaryImgUrl.indexOf("/upload/");
    if (indexOfUpload === -1) {
        console.log("CLOUDINARY DELETE ERROR: Invalid Cloudinary URL");
        return false;
    }

    // Slice everything after '/upload/' (+8 because '/upload/' is 8 characters)
    // Result: v1234567890/folder/subfolder/filename.jpg  (version may or may not exist)
    const afterUpload = cloudinaryImgUrl.slice(indexOfUpload + 8);

    // Remove version prefix if present ('v' followed by digits and a slash)
    // v1234567890/folder/subfolder/filename.jpg -> folder/subfolder/filename.jpg
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');

    // Remove file extension using lastIndexOf to handle filenames that contain dots
    // e.g. "my.photo.jpg" -> "my.photo" not "my"
    const indexOfLastDot = withoutVersion.lastIndexOf('.');
    const publicId = withoutVersion.slice(0, indexOfLastDot);
    // Final publicId: node-video-hosting-backend-uploads/user/filename
    // console.log(publicId);

    const { result } = await cloudinary.uploader.destroy(publicId);
    
    if (result === 'ok') {
        console.log('DELETE SUCCESSFUL FROM CLOUDINARY. PUBLIC ID:', publicId);
        return true;
    }

    console.log('DELETE ATTEMPTED BUT FILE NOT FOUND ON CLOUDINARY:', publicId);
    return false;
  }
  catch(error: unknown) {
    // Don't throw error as it could block the main code that started running before it
    if(error instanceof Error) {
      console.log('CLOUDINARY DELETE ERROR:', error.message);
    }
    else {
      console.log('CLOUDINARY DELETE ERROR:', error);
    }

    return false;
  }
}

export { cloudinaryUploader, cloudinaryDeleter };