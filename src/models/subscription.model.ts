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
		ref: 'User',
		required: [true, 'Subscriber is required.']
	},
	channel: { // User, who is subscribed by another User (Subscriber)
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Channel is required.']
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

// When an user subscribes another channel (user), a single docuMent of this type will be created
// When a channel is subscribed by another channel (user), a single docuMent of this type will be created

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



/*******************  MONGODB AGGREGATION EXAMPLE  *******************/
// db.books.aggregate([
//     /**
//      * STAGE 1: $lookup (The "Join" Stage)
//      * Combines data from another collection.
//      * Note: MongoDB ALWAYS returns the result as an ARRAY [ ],
//      * even if only one match is found.
//      */
//     {
//         $lookup: {
//             from: 'authors',          // The collection to pull data FROM
//             localField: 'author_id',  // The FK (foreign key) in 'books'
//             foreignField: '_id',      // The PK (primary key) in 'authors'
//             as: 'author_details'      // The name for the new array field
//         }
//     },

//     /**
//      * STAGE 2: $addFields + $first (The "Cleaning" Stage)
//      * Since $lookup gives us an array like [ {name: "Krishna"} ],
//      * we use $first to extract the object inside.
//      * This makes it a single object {name: "Orwell"} for easier access.
//      */
//     {
//         $addFields: {
//             author_details: { 
//                 $first: '$author_details' 
// 				   // $arrayElemAt: ['$author_details', 0] // same as last step
//             }
//         }
//     }
// ]);

/**
 * VISUAL EXAMPLE
 * * 1. YOUR COLLECTIONS:
 * Books:   { "title": "1984", "author_id": 50 }
 * Authors: { "_id": 50, "name": "Krishna" }
 * * 2. AFTER STAGE 1 ($lookup):
 * {
 * "title": "1984",
 * "author_id": 50,
 * "author_details": [ { "_id": 50, "name": "Krishna" } ]
 * }
 * // ^ Note the [ brackets ]. It is a list.
 * * 3. AFTER STAGE 2 ($first):
 * {
 * "title": "1984",
 * "author_id": 50,
 * "author_details": { "_id": 50, "name": "George Orwell" }
 * }
 * // ^ Brackets gone. It is now a clean object.
 */

/**
 * QUICK COMPARISON:
 * - $first: Keeps the book even if the author doesn't exist (Left Join).
 * - $unwind: Deletes the book from results if the author doesn't exist (Inner Join).
 */