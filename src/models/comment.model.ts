import mongoose from 'mongoose';
import type { Document, Model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

// Either Video's or Post's comment
interface IComment {
 	content: string,
 	video?: mongoose.Types.ObjectId,
	post?: mongoose.Types.ObjectId,
 	creator: mongoose.Types.ObjectId,
 	isChildComment: boolean,
 	parentComment?: mongoose.Types.ObjectId
}

type CommentDocument = IComment & Document;

interface CommentModel extends Model<CommentDocument> {
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
// The mongooseAggregatePaginate plugin requires a specific type definition to 
// let TypeScript know the .aggregatePaginate() method exists on our model

/*
Why aggregatePaginate needs to be declared at all
When we do:
commentSchema.plugin(mongooseAggregatePaginate)
This adds .aggregatePaginate() method to the model at runtime. But TypeScript only knows what we tell it at compile time. 
The plugin doesn't automatically tell TypeScript it added a new method.
So without declaring it:
Comment.aggregatePaginate(...)  // ERROR - TypeScript doesn't know this exists
By declaring it in CommentModel:
interface CommentModel extends Model<CommentDocument> {
    aggregatePaginate: any  // now TypeScript knows it exists
}
Now:
Comment.aggregatePaginate(...)  // TypeScript is happy
*/

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
 	isChildComment: {
 		type: Boolean,
 		default: false,
 		required: [true, 'Child comment flag is required.']
 	},
 	parentComment: {
 		type: mongoose.Schema.Types.ObjectId,
 		ref: 'Comment',
 	}
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate as any);
// Type casted with 'as any' by bypassing a known TS mismatch between newer Mongoose versions and this plugins's
// older type definitions

export const Comment = mongoose.model<CommentDocument, CommentModel>('Comment', commentSchema);
export type { CommentDocument, CommentModel };