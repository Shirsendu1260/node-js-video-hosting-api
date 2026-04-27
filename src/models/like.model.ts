import mongoose from "mongoose";
import type { Document, AggregatePaginateModel } from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// A like can belongs to any one of these - Comment, Video, Post
interface ILike {
	comment?: mongoose.Types.ObjectId,
	video?: mongoose.Types.ObjectId,
	post?: mongoose.Types.ObjectId,
	likedBy: mongoose.Types.ObjectId,
	isDislike: boolean
}

type LikeDocument = ILike & Document;
type LikeModel = AggregatePaginateModel<LikeDocument>;

const likeSchema = new mongoose.Schema<LikeDocument, LikeModel>({
	comment: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Comment',
        default: undefined // This forces Mongoose to truly omit the field from the document instead 
        // of writing null
	},
	video: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Video',
        default: undefined
	},
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Post',
        default: undefined
	},
	likedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Liked By user is required.']
	},
	isDislike: {
		type: Boolean,
		required: true	
	}
}, { timestamps: true });

// Why do we need these indexes at all?
// A single Like document can belong to a video, post, or comment.
// So when a user likes a video, the 'post' and 'comment' fields simply don't exist in that document.
// We need unique indexes to prevent a user from liking the same thing twice.

// Problem with simple unique indexes:
// If we just do { post: 1, likedBy: 1 } unique, MongoDB treats missing 'post' as null.
// So two users liking two different videos would both have { post: null, likedBy: userId },
// and MongoDB would scream duplicate key — even though they're completely unrelated documents.

// Problem with sparse: true:
// Sounds like the right fix, but it doesn't work on compound indexes.
// MongoDB only skips a document from a sparse compound index if ALL indexed fields are absent.
// Since 'likedBy' is always present, no document ever gets skipped — sparse does nothing here.

// Actual fix — partialFilterExpression:
// This tells MongoDB: "only include a document in this index if this condition is true."
// So the post index only tracks documents where 'post' actually exists,
// completely ignoring video likes and comment likes. Each index minds its own business.
likeSchema.index(
	{ video: 1, likedBy: 1 },
	{ 
        unique: true, 
        partialFilterExpression: { video: { $exists: true } }
    }
);
likeSchema.index(
	{ post: 1, likedBy: 1 },
	{ 
        unique: true, 
        partialFilterExpression: { post: { $exists: true } }
    }
);
likeSchema.index(
	{ comment: 1, likedBy: 1 },
	{ 
        unique: true, 
        partialFilterExpression: { comment: { $exists: true } }
    }
);

likeSchema.plugin(mongooseAggregatePaginate as any);

export const Like = mongoose.model<LikeDocument, LikeModel>('Like', likeSchema);
export type { LikeDocument, LikeModel };
