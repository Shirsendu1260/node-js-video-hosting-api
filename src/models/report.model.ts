import mongoose from 'mongoose';
import type { Document, AggregatePaginateModel } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

interface IReport {
	reporter: mongoose.Types.ObjectId,
	targetId: mongoose.Types.ObjectId,
	targetModel: 'Video' | 'Post' | 'Comment',
	reason: 'Hate Speech' | 'Harassment' | 'Violence' | 'Spam' | 'Scam' | 'Inappropriate' | 'Other',
	details?: string,
	status: 'PEND' | 'REV' | 'RES' // 'PEND' -> 'Pending', 'REV' -> 'Reviewed', 'RES' -> 'Resolved'
}

type ReportDocument = IReport & Document;
type ReportModel = AggregatePaginateModel<ReportDocument>;

const reportSchema = new mongoose.Schema<ReportDocument, ReportModel>({
	reporter: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Reporter is required.']
	},
	// targetId can point to either a Video or a Post
	targetId: {
		type: mongoose.Schema.Types.ObjectId,
		required: [true, 'ID (Video/Post/Comment) is required.'],
		refPath: 'targetModel' // polymorphic relationship with 'refPath' to Video, Post or Comment model
	},
	// Limits reports to only Video, Comment or Post model
	targetModel: {
		type: String,
		required: [true, 'Model (Video/Post/Comment) is required.'],
		enum: ['Video', 'Post', 'Comment']
	},
	reason: {
		type: String,
		required: [true, 'Reason is required.'],
		enum: ['Hate Speech', 'Harassment', 'Violence', 'Spam', 'Scam', 'Inappropriate', 'Other']
	},
	details: {
		type: String,
		trim: true
	},
	status: {
		type: String,
		required: [true, 'Status is required.'],
		enum: ['PEND', 'REV', 'RES'],
		description: "'PEND' -> 'Pending', 'REV' -> 'Reviewed', 'RES' -> 'Resolved'"
	}
}, { timestamps: true });

// Adding a compound index to ensure that a user cannot report the same video/post/comment twice (unique: true)
// And also making the query searching faster with this index
reportSchema.index({
	reporter: 1,
	targetId: 1
}, { unique: true });

reportSchema.plugin(mongooseAggregatePaginate as any);

export const Report = mongoose.model<ReportDocument, ReportModel>('Report', reportSchema);
export type { ReportDocument, ReportModel };