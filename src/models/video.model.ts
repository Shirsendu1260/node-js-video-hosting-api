import mongoose from 'mongoose';
import type { Document, AggregatePaginateModel } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

/*
mongoose-aggregate-paginate-v2
This is a plugin that adds pagination support to aggregation queries.
Meaning:
We can do complex aggregation pipelines and still paginate results easily without manual pagination.
*/




/******** INTERFACES & TYPES ********/

interface IVideo {
	// Direct HTTPS link for MP4 file
	videoFile: string,
	
	// Adaptive streaming link (HLS/DASH); use this with a player like Video.js to auto-adjust quality based 
	// on user internet speed.
	playbackUrl: string,

	thumbnail?: string,
	creator: mongoose.Types.ObjectId,
	title: string,
    description?: string,
    duration: number,
    views: number,
    isPublished: boolean,
    isShorts: boolean // Is a short format video or not
}

type VideoDocument = IVideo & Document;

// // Defining the Paginate Method
// interface VideoModel extends Model<VideoDocument> {
// 	// Telling TypeScript that this function exists on our Video model
// 	aggregatePaginate(
// 		// aggregatePaginate doesn't take a simple object; it takes a Mongoose Aggregate 
// 		// object (the result of Video.aggregate([]))
// 		query: mongoose.Aggregate<any[]>,

// 		options: {
// 			page?: number;
//          limit?: number;
// 		}
// 	): Promise<any>;
// }

// We use mongoose's built-in type for aggregate paginate. It automatically let TS knows about 
// .aggregatePaginate(), .find(), .create(), etc.
// By passing <VideoDocument> into AggregatePaginateModel, the plugin now knows that the 
// result of the pagination will be a list of Video documents, not just a list of 'any'
type VideoModel = AggregatePaginateModel<VideoDocument>;




/******** SCHEMA ********/

const videoSchema = new mongoose.Schema<VideoDocument, VideoModel>({
	videoFile: {
		type: String,
		required: [true, 'Video file is required']
	},
	playbackUrl: {
		type: String,
		required: [true, 'Video playback URL is required']
	},
	thumbnail: {
		type: String
	},
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Creator is required'],
		index: true // We index this to quickly fetch the user's videos
	},
	title: {
		type: String,
		required: [true, 'Title is required'],
	},
	description: {
		type: String
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
        default: true,
        index: true // We index this to quickly skip private videos in public feeds for non-logged in user
	},
	isShorts: {
		type: Boolean,
        required: true,
        default: false,
        index: true // We index this to separate Shorts from Long-form videos efficiently
	}
}, { timestamps: true });




/******** INDEXES ********/

/*
1. B-tree Index (index: true):
Think of this like an alphabetical list like phonebook.
Best for: Exact matches ("My Video") or "starts with" (/^My/).
The Flaw: If we search for "Video" (middle of the string), MongoDB has to look at every single document. 
		  It’s slow for 'contains' searches ('My Video' contains 'Video').
If this type of index is on 'title', MongoDB can only use that index if search starts at the beginning.
Fast (Index used): ^Apple (Finds "Apple Pro")
Slow (Full scan): Apple (Finds "The Apple Pro" or "Green Apple")

2. Text Index ('text'):
Think of this like an index at the back of a textbook.
Best for: Search bars. It breaks our title into words: ['My', 'Video'].
The Benefit: If someone searches 'Video', MongoDB knows exactly which documents have that word, 
			 regardless of where it is. It also supports 'weighting' (making title matches more 
			 important than description matches).
*/

// So we create text indexes to allow efficient keyword based searching.
// This allows us to search 'contains' searches on both title and description.
videoSchema.index(
	{
		title: 'text',
		description: 'text'
	},
	{
		weights: { title: 5, description: 1 }, // We make title matches 5x more important than description
		name: "VideoSearchIndex"
	}
);

// Text index: We can now search for keywords anywhere in the title or description, not just at the start. 
// 			   It’s faster and more flexible than a basic search.
// Boolean indexes: We indexed isPublished and isShorts so the database doesn't have to scan every single 
// 				    video just to find public content or shorts.
// Weights: We prioritized the Title over the Description. If a keyword matches the title, it ranks higher, 
// 		    making our search results feel more relevant.




// plugin() -> A reusable function that adds extra functionality to a schema.
videoSchema.plugin(mongooseAggregatePaginate as any);




/******** MODEL ********/

export const Video = mongoose.model<VideoDocument, VideoModel>('Video', videoSchema);
export type { VideoDocument, VideoModel };