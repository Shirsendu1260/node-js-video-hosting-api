import mongoose from 'mongoose';
import type { Document, AggregatePaginateModel } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// Either Video's or Post's comment
interface IComment {
 	content: string,
 	video?: mongoose.Types.ObjectId,
	post?: mongoose.Types.ObjectId,
 	creator: mongoose.Types.ObjectId,
 	likesCount: number,
 	dislikesCount: number,
 	isChildComment: boolean, // isChildComment = true means it's a reply of a parent comment
 	parentComment?: mongoose.Types.ObjectId
}

type CommentDocument = IComment & Document;
type CommentModel = AggregatePaginateModel<CommentDocument>;

const commentSchema = new mongoose.Schema<CommentDocument, CommentModel>({
 	content: {
 		type: String,
 		required: [true, 'Comment content is required.']
 	},
 	video: {
 		type: mongoose.Schema.Types.ObjectId,
 		ref: 'Video',
 	},
 	post: {
 		type: mongoose.Schema.Types.ObjectId,
 		ref: 'Post',
 	},
 	creator: {
 		type: mongoose.Schema.Types.ObjectId,
 		ref: 'User',
 		required: [true, 'Creator is required.']
 	},
 	likesCount: {
 		type: Number,
 		default: 0
 	},
 	dislikesCount: {
 		type: Number,
 		default: 0
 	},
 	isChildComment: {
 		type: Boolean,
 		default: false,
 		required: [true, 'Reply flag is required.']
 	},
 	parentComment: {
 		type: mongoose.Schema.Types.ObjectId,
 		ref: 'Comment',
 	}
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate as any);
// Type casted with 'as any' by bypassing a known TS mismatch between newer Mongoose versions and 
// this plugins's older type definitions

export const Comment = mongoose.model<CommentDocument, CommentModel>('Comment', commentSchema);
export type { CommentDocument, CommentModel };