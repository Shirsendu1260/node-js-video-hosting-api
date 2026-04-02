import mongoose from 'mongoose';
import type { Document, AggregatePaginateModel } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

interface IPlaylist {
	name: string,
	description?: string,
	videos: mongoose.Types.ObjectId[],
	creator: mongoose.Types.ObjectId
}

type PlaylistDocument = IPlaylist & Document;
type PlaylistModel = AggregatePaginateModel<PlaylistDocument>;

const playlistSchema = new mongoose.Schema<PlaylistDocument, PlaylistModel>({
	name: {
		type: String,
		required: [true, 'Name is required.']
	},
	description: {
		type: String
	},
	videos: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Video'
		}
	],
	creator: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Creator is required.']
	}
}, { timestamps: true });

playlistSchema.plugin(mongooseAggregatePaginate as any);

export const Playlist = mongoose.model<PlaylistDocument, PlaylistModel>('PlaylistModel', playlistSchema);
export type { PlaylistDocument, PlaylistModel };