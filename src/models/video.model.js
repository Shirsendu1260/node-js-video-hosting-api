import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

/*
mongoose-aggregate-paginate-v2
This is a plugin that adds pagination support to aggregation queries.
Meaning:
You can do complex aggregation pipelines and still paginate results easily without manual pagination.
*/

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

// plugin() -> A reusable function that adds extra functionality to a schema.
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);