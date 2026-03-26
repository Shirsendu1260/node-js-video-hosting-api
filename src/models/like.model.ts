import mongoose from "mongoose";
import type { Document, Model } from "mongoose";

// A like can belongs to any one of these - Comment, Video, Post
interface ILike {
	comment?: mongoose.Types.ObjectId,
	video?: mongoose.Types.ObjectId,
	post?: mongoose.Types.ObjectId,
	likedBy: mongoose.Types.ObjectId
}

type LikeDocument = ILike & Document;
type LikeModel = Model<LikeDocument>;

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
	}
}, { timestamps: true });

export const Like = mongoose.model<LikeDocument, LikeModel>('Like', likeSchema);
export type { LikeDocument, LikeModel };