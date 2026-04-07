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
		ref: 'Comment'
	},
	video: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Video'
	},
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Post'
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

/*likeSchema.index({ video: 1, likedBy: 1 }, { unique: true })
likeSchema.index({ post: 1, likedBy: 1 }, { unique: true })
likeSchema.index({ comment: 1, likedBy: 1 }, { unique: true })
Since video, post, and comment are all optional fields, a document with no video field will 
have video: undefined. MongoDB treats undefined as null for unique indexes, so the first user to 
like a post would create { video: null, likedBy: userId }, and the second user trying to like a 
different post would also get { video: null, likedBy: userId } —> unique index violation.
Fixing this using sparse indexes:*/

// sparse: true tell MongoDB to only index documents where the field actually exists, ignoring 
// documents where video, post, or comment is absent (null/undefined)
// So from the above example, { video: null, likedBy: userId } will be ignored

// Adding three UNIQUE COMPOUND INDEXes with SPARSE INDEXES
// This prevents duplicate like/dislikes in the database
// Only one user can have only one like or one dislike per video, post, comment
likeSchema.index(
	{ video: 1, likedBy: 1 },
	{ unique: true, sparse: true }
);
likeSchema.index(
	{ post: 1, likedBy: 1 },
	{ unique: true, sparse: true }
);
likeSchema.index(
	{ comment: 1, likedBy: 1 },
	{ unique: true, sparse: true }
);

likeSchema.plugin(mongooseAggregatePaginate as any);

export const Like = mongoose.model<LikeDocument, LikeModel>('Like', likeSchema);
export type { LikeDocument, LikeModel };