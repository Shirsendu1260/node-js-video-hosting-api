import mongoose from 'mongoose';
import type { Document, Model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

interface IPost {
	creator: mongoose.Types.ObjectId,
	content: string,
	image?: string
}

type PostDocument = IPost & Document;

interface PostModel extends Model<PostDocument> {
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
	}
}, { timestamps: true });

postSchema.plugin(mongooseAggregatePaginate as any);

export const Post = mongoose.model<PostDocument, PostModel>('Post', postSchema);
export type { PostDocument, PostModel };