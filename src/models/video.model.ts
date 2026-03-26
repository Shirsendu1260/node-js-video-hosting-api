import mongoose from 'mongoose';
import type { Document, Model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

/*
mongoose-aggregate-paginate-v2
This is a plugin that adds pagination support to aggregation queries.
Meaning:
You can do complex aggregation pipelines and still paginate results easily without manual pagination.
*/




/******** INTERFACES & TYPES ********/

interface IVideo {
	videoFile: string,
	thumbnail?: string,
	creator: mongoose.Types.ObjectId,
	title: string,
    description: string,
    duration: number,
    views: number,
    isPublished: boolean
}

type VideoDocument = IVideo & Document;

interface VideoModel extends Model<VideoDocument> {
	aggregatePaginate: any;

	// aggregatePaginate(
    //     query: mongoose.Aggregate<any>,
    //     options?: {
    //         page?: number;
    //         limit?: number;
    //         sort?: any;
    //         customLabels?: any;
    //         [key: string]: any;
    //     }
    // ): Promise<any>;
}




/******** SCHEMA ********/

const videoSchema = new mongoose.Schema<VideoDocument, VideoModel>({
	videoFile: {
		type: String, // Cloudinary uploaded image's URL
		required: [true, 'Video file is required']
	},
	thumbnail: {
		type: String // Cloudinary uploaded image's URL
	},
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Creator is required']
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
videoSchema.plugin(mongooseAggregatePaginate as any);




/******** MODEL ********/

export const Video = mongoose.model<VideoDocument, VideoModel>('Video', videoSchema);
export type { VideoDocument, VideoModel };