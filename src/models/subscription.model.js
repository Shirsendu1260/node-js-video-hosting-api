import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
	subscriber: { // User, who is subscribing to another User (Channel)
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	channel: { // User, who is subscribed by another User (Subscriber)
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);