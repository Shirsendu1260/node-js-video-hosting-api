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






// User -> a, b, c, d, e
// Channels -> CNLA, CNLB, CNLC
// Both of the types are of User model

/* Each document structure:
{
	....
    subscriber: ...,
	channel: '''
    ....
}
*/

// When an user subscribes another channel (user), a single docuent of this type will be created
// When a channel is subscribed by another channel (user), a single docuent of this type will be created

/* User 'a' subscribes channel 'CNLA':
{
	subscriber: 'a',
	channel: 'CNLA'
}
*/

/* User 'b' subscribes channel 'CNLA':
{
	subscriber: 'b',
	channel: 'CNLA'
}
*/

/* User 'c' subscribes channels -> 'CNLA', 'CNLB', 'CNLC':
{
	subscriber: 'c',
	channel: 'CNLA'
},
{
	subscriber: 'c',
	channel: 'CNLB'
},
{
	subscriber: 'c',
	channel: 'CNLC'
}
*/


// We can see, an user (c) can subscribe multiple channels (CNLA, CNLB, CNLC)
// And, a single channel (CNLA) can subscribed by multiple users/channels (a, b, c)


/*******  1  *******/
// NOW COUNTING SUBSCRIBER COUNT OF CHANNEL 'CNLA':
// Select the documents that has channel: 'CNLA'
/*  { subscriber: 'a', channel: 'CNLA' },
	{ subscriber: 'b', channel: 'CNLA' },
    { subscriber: 'c', channel: 'CNLA' }   */
// Count = 3
// FORMULA: In this model, find the documents to count SUBSCRIBERs that has matching CHANNEL


/*******  2  *******/
// NOW COUNTING TOTAL SUBSCRIBED CHANNEL COUNT OF USER 'c':
// Select the documents that has subscriber: 'c'
/*  { subscriber: 'c', channel: 'CNLA' },
    { subscriber: 'c', channel: 'CNLB' },
    { subscriber: 'c', channel: 'CNLC' }   */
// Count = 3
// FORMULA: In this model, find the documents to count subscribed CHANNELs of a user that has matching SUBSCRIBER