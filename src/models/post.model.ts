import mongoose from 'mongoose';
import type { Document, AggregatePaginateModel } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

interface IPost {
	creator: mongoose.Types.ObjectId,
	content: string,
	image?: string,
	likesCount: number,
 	dislikesCount: number,
}

type PostDocument = IPost & Document;
type PostModel = AggregatePaginateModel<PostDocument>;

const postSchema = new mongoose.Schema<PostDocument, PostModel>({
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Creator is required.']
	},
	content: {
		type: String,
		required: [true, 'Post content is required.']
	},
	image: {
		type: String
	},
	likesCount: {
 		type: Number,
 		default: 0
 	},
 	dislikesCount: {
 		type: Number,
 		default: 0
 	},
}, { timestamps: true });

postSchema.plugin(mongooseAggregatePaginate as any);

export const Post = mongoose.model<PostDocument, PostModel>('Post', postSchema);
export type { PostDocument, PostModel };