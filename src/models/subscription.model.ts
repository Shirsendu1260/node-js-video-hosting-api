import mongoose from 'mongoose';
import type { Document, Model } from 'mongoose';

interface ISubscription {
	subscriber: mongoose.Types.ObjectId,
	channel: mongoose.Types.ObjectId
}

type SubscriptionDocument = ISubscription & Document;
type SubscriptionModel = Model<SubscriptionDocument>;

const subscriptionSchema = new mongoose.Schema<SubscriptionDocument, SubscriptionModel>({
	subscriber: { // User, who is subscribing to another User (Channel)
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	channel: { // User, who is subscribed by another User (Subscriber)
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
}, { timestamps: true });

export const Subscription = mongoose.model<SubscriptionDocument, SubscriptionModel>('Subscription', subscriptionSchema);
export type { SubscriptionDocument, SubscriptionModel };