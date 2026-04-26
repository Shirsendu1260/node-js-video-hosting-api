import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import type { UploadApiResponse, UploadApiOptions } from 'cloudinary';

// Adding playback_url in Cloudinary 'UploadApiResponse' type as we will add that later in this code
declare module 'cloudinary' {
    interface UploadApiResponse {
        playback_url?: string
    }
}

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Return "https" URLs by setting secure: true
});

// Uploads a file to Cloudinary with specialized logic for Video Streaming.
// Handles both images (standard upload) and videos (adaptive bitrate streaming)
const cloudinaryUploader = async (
  localFilePath: string,
  subFolder: string
): Promise<UploadApiResponse | null> => {
  if(!localFilePath) return null;

  // Identify file type for a video
  const isVideo = localFilePath.match(/\.(mp4|mov|avi|mkv|webm)$/i);

  const options: UploadApiOptions = {
    use_filename: true, // Use original filename as public_id (unique identifier of the uploaded file)
    unique_filename: false, // Don't append random suffix to filename
    overwrite: true, // Overwrite if same filename already exists
    resource_type: 'auto', // Auto-detect file type (image, video, raw)
    folder: 'node-video-hosting-backend-uploads/' + subFolder
  };

  // If it's a video, we tell Cloudinary to generate an .m3u8 manifest (for ABR/HLS)
  // Cloudinary has many profiles (HD, Full_HD, etc.). Using 'low' limits the output to 320p (240p, 320p videos)
  if(isVideo) {
    options.transformation = {
      streaming_profile: 'low',
      format: 'm3u8'
    };
    options.chunk_size = 5000000; // 5MB per chunks (ideal for slow connections)
    options.timeout = 120000; // 2min timeout

    // upload_large: On a slow network, here is how our code handles a 200MB upload: The file is 
    // sliced into 40 chunks (5MB each). If the connection flickers during chunk no. 20, only that 
    // 5MB piece needs to retry, not the entire 200MB. If the network is so slow that a single 5MB 
    // chunk takes longer than 60 seconds, the upload will fail and trigger our catch block.

    // Adaptive Bitrate Streaming (HLS):
    // Instead of just serving a raw .mp4 link, we are generating a .m3u8 manifest. Using the low 
    // streaming profile (targeting 240p/320p) ensures the video starts playing almost instantly.
    // The HLS player (like Hls.js) can automatically upgrade to higher quality if the user's 
    // internet speed improves during middle of watching.
  }

  let uploadResult: UploadApiResponse | null = null;

	try {
    // Upload the local file from server to Cloudinary cloud storage
    uploadResult = isVideo
                   ? await cloudinary.uploader.upload_large(localFilePath, options) as UploadApiResponse
                   : await cloudinary.uploader.upload(localFilePath, options) as UploadApiResponse;
    
    // Generate the Playback URL
    // secure_url (Static MP4): One single big file. Easy to use, but if the internet is slow, 
    //                          the video stops to buffer.
    // playback_url (HLS/M3U8): A playlist of many tiny video segments. The player (Hls.js) can switch 
    //                          between 240p and 320p mid-stream without the user ever seeing a loading spinner.
    if(uploadResult.resource_type === 'video') {
      // Why are we manually constructing this URL instead of just using 'uploadResult.playback_url'?
      // 1. API LIMITATION: When using 'upload_large' (chunked uploading), 
      //    Cloudinary often returns the response before the background 
      //    processing (slicing the video into HLS chunks) is finished. 
      //    This means 'uploadResult.playback_url' is frequently 'undefined'.
      // 2. DETERMINISTIC URLS: Cloudinary URLs follow a strict pattern. 
      //    If we know the 'public_id' and the 'streaming_profile', we can 
      //    predict the exact URL where the video will live.
      uploadResult.playback_url = uploadResult.secure_url
                                              .replace('/upload/', '/upload/sp_low/')
                                              .replace(/\.[^/.]+$/, '.m3u8');
    }

    // Flow when using 'upload_large': 
    // 1. User sends a video (e.g., 20MB MP4).
    // 2. Our Node.js server temporarily holds the file.
    // 3. Our server sends the file in 5MB chunks.
    // 4. Cloudinary receives the full file and immediately starts a background worker to slice 
    //    it into tiny .ts segments (the HLS chunks).
    // 5. Our code doesn't wait for those chunks to be ready. It creates the 'Map' (playback_url) 
    //    based on known Cloudinary patterns and returns it.
    // 6. Frontend Playback: When the user hits play, the HLS player reads the playback_url and 
    //    starts fetching those tiny segments one by one.

    console.log('UPLOAD SUCCESSFUL ON CLOUDINARY. SOURCE:', uploadResult.secure_url);

    // Example of 'uploadResult' if type is 'UploadApiResponse' for an image
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

    return null;
	}
  finally {
    // 'finally' always runs whether upload succeeded or failed
    // When 'finally' runs, upload_large stream is fully done
    // So we can safely delete the file now
    try {
      if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath)
      }
    }
    catch(unlinkError) {
      console.log('TEMP FILE DELETE ERROR:', unlinkError);  
    }
  }
};

// Delete uploaded file
const cloudinaryDeleter = async (cloudinaryAssetUrl: string): Promise<boolean> => {
  try {
    if(!cloudinaryAssetUrl) return false;

    // Extract public_id from the Cloudinary secure_url
    // URL example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/subfolder/filename.jpg
    // Real example: "https://res.cloudinary.com/myprojects/video/upload/v1234567890/node-backend-uploads/video/filename.mp4",
    
    const indexOfUpload = cloudinaryAssetUrl.indexOf("/upload/");
    if (indexOfUpload === -1) {
        console.log("CLOUDINARY DELETE ERROR: Invalid Cloudinary URL");
        return false;
    }

    // Slice everything after '/upload/' (+8 because '/upload/' is 8 characters)
    // Result: v1234567890/folder/subfolder/filename.jpg  (version may or may not exist)
    const afterUpload = cloudinaryAssetUrl.slice(indexOfUpload + 8);

    // Remove version prefix if present ('v' followed by digits and a slash)
    // v1234567890/folder/subfolder/filename.jpg -> folder/subfolder/filename.jpg
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');

    // Remove file extension using lastIndexOf to handle filenames that contain dots
    // e.g. "my.photo.jpg" -> "my.photo" not "my"
    const indexOfLastDot = withoutVersion.lastIndexOf('.');
    const publicId = withoutVersion.slice(0, indexOfLastDot);
    // Final publicId: node-video-hosting-backend-uploads/user/filename, node-backend-uploads/video/filename.mp4
    // console.log(publicId);

    // Detect resource type from url
    const resourceType = cloudinaryAssetUrl.includes('/video/upload/') ? 'video' : 'image';

    const { result } = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    
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
