import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
	videoFile: {
		type: String, // Cloudinary uploaded image's URL
		required: [true, 'Video file is required']
	},
	thumbnail: {
		type: String // Cloudinary uploaded image's URL
	},
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	title: {
		type: String,
		required: [true, 'Title is required']
	},
	description: {
		type: String,
		required: [true, 'Description is required']
	},
	duration: {
		type: Number, // Will be collected from Cloudinary API
		required: [true, 'Duration is required']
	},
	views: {
		type: Number,
		required: true,
		default: 0
	},
	isPublished: {
		type: Boolean,
		required: true,
		default: true
	}
}, { timestamps: true });

export const Video = mongoose.model('Video', videoSchema);