import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Report } from '../models/report.model.js';
import { Video } from '../models/video.model.js';
import { Post } from '../models/post.model.js';
import { Comment } from '../models/comment.model.js';
import type { IErrorMessage } from "../utils/ApiError.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import Joi from 'joi';
import mongoose from 'mongoose';



// For submitting a new report for a Video, Comment or Post
const submitReport = asyncHandler(async (req, res) => {
	const { targetModel, reason, details } = req.body as {
		targetModel: string,
		reason: string,
		details?: string
	};
    const { targetId } = req.params as { targetId: string };

	if(!req.user) {
        throw new ApiError(401, 'You need to be authenticated to report this content.');
    }

    if(!mongoose.Types.ObjectId.isValid(targetId)) {
    	throw new ApiError(400, 'Invalid target ID.');
    }

	const validatorSchema = Joi.object({
		targetModel: Joi.string()
                        .trim()
                        .valid('Video', 'Post', 'Comment')
                        .required()
                        .messages({
                          'any.only': 'targetModel must be Video or Post.',
                          'any.required': 'targetModel is required.'
                        }),
    	reason: Joi.string()
                    .trim()
                    .valid('Hate Speech', 'Harassment', 'Violence', 'Spam', 'Scam', 'Inappropriate', 'Other')
                    .required()
                    .messages({
                      'any.only': 'Reason must be Hate Speech, Harassment, Violence, Spam, Scam, Inappropriate or Other.',
                      'any.required': 'Reason is required.'
                    }),
        details: Joi.string()
                    .trim()
                    .max(5000)
                    .allow('')
                    .messages({
                        'string.max': 'Details cannot exceed 5000 characters.',
                    })
	});

	const { error } = validatorSchema.validate(
        { targetModel, reason, details },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { 
                [detail.path[0] as string]: detail.message 
            }
        });

        // console.log(errorArray);
        throw new ApiError(400, 'Report submit validation failed.', errorArray);
    }

    // Check if user has already made report for this content
    const existingReport = await Report.findOne({
    	reporter: new mongoose.Types.ObjectId(req.user._id),
    	targetId: new mongoose.Types.ObjectId(targetId)
    });

    if(existingReport) {
        throw new ApiError(400, 'You have already reported this content earlier. Our team is reviewing it.');
    }

    // Create report
    const reportCreated = await Report.create({
        reporter: req.user._id,
        targetId,
        targetModel,
        reason,
        details,
        status: 'PEND'
    });

    return res.status(201).json(
        new ApiResponse(201, reportCreated, 'Report sent successfully.')
    );
});



const updateReportStatus = asyncHandler(async (req, res) => {
    const { reportId } = req.params as { reportId: string };
    const { status } = req.body as { status: 'PEND' | 'REV' | 'RES' };

    const decodedReportId = getBase64DecodedId(reportId);

    const statusValidation = ['PEND', 'REV', 'RES'].includes(status);

    if(!statusValidation) {
        throw new ApiError(400, 'Invalid status update.');
    }

    const reportUpdated = await Report.findByIdAndUpdate(
        decodedReportId,
        {
            $set: { status }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!reportUpdated) {
        throw new ApiError(404, 'Report not found.');
    }

    // When admin resolves a report, hide the content
    if(status === 'RES') {
        if(reportUpdated.targetModel === 'Video') {
            await Video.findByIdAndUpdate(reportUpdated.targetId, { isHidden: true });
        }
        else if(reportUpdated.targetModel === 'Post') {
            await Post.findByIdAndUpdate(reportUpdated.targetId, { isHidden: true });
        }
        else {
            await Comment.findByIdAndUpdate(reportUpdated.targetId, { isHidden: true });
        }
    }

    // When admin updates report back to PEND or REV, unhide the content
    if(status === 'PEND' || status === 'REV') {
        if(reportUpdated.targetModel === 'Video') {
            await Video.findByIdAndUpdate(reportUpdated.targetId, { isHidden: false });
        }
        else if(reportUpdated.targetModel === 'Post') {
            await Post.findByIdAndUpdate(reportUpdated.targetId, { isHidden: false });
        }
        else {
            await Comment.findByIdAndUpdate(reportUpdated.targetId, { isHidden: false });
        }
    }

    return res.status(200).json(
        new ApiResponse(200, reportUpdated, `Report status (status: '${status}') update successfully.`)
    );
});



const getAllReports = asyncHandler(async (req, res) => {
    let { 
        page = 1, 
        limit = 4,
        status,
        targetModel
    } = req.query as {
        page?: string,
        limit?: string,
        status?: string,
        targetModel?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);

    if(status) {
        const statusValidation = ['PEND', 'REV', 'RES'].includes(status);
        if(!statusValidation) {
            throw new ApiError(400, 'Invalid status update.');
        }
    }

    let matchCondition: { status?: string, targetModel?: string } = {};
    if(status) matchCondition.status = status;
    if(targetModel) matchCondition.targetModel = targetModel;

    const reportAggregate = Report.aggregate([
        // Match by report status or target model (Video/Post)
        {
            $match: matchCondition
        },

        // Lookup to get reporter (user) details for each report
        {
            $lookup: {
                from: 'users',
                localField: 'reporter',
                foreignField: '_id',
                as: 'reporter',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        // Flatten the user lookup array
        {
            $addFields: {
                reporter: { $first: '$reporter' }
            }
        },

        // Lookup to get content (Video/Post) details
        // Since we are using 'refPath', the 'from' field need to be dynamic
        // Aggregation does not support dynamic 'from' in a single $lookup easily
        // so we use $lookup for both, then we choose which one to keep based on admin's request (targetModel)
        
        // 1. Lookup for Video details for each video report
        {
            $lookup: {
                from: 'videos',
                localField: 'targetId',
                foreignField: '_id',
                as: 'targetVideo',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1
                        }
                    }
                ]
            }
        },

        // 2. Lookup for Post details for each post report
        {
            $lookup: {
                from: 'posts',
                localField: 'targetId',
                foreignField: '_id',
                as: 'targetPost',
                pipeline: [
                    {
                        $project: { content: 1 }
                    }
                ]
            }
        },

        // Now we choose which one to keep so that 'target' contains either video or post
        {
            $addFields: {
                targetData: {
                    $cond: {
                        if: {
                            $eq: ['$targetModel', 'Video']
                        },
                        then: { $first: '$targetVideo' },
                        else: { $first: '$targetPost' }
                    }
                }
            }            
        },

        // Remove unnecesary keys
        {
            $project: {
                targetVideo: 0,
                targetPost: 0
            }
        },

        // Sort by latest reports
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const options = {
        page: pageNo,
        limit: limitCount
    };

    const result = await Report.aggregatePaginate(reportAggregate, options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No reports found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All reports are fetched successfully.')
    );
});



export {
    submitReport,
    updateReportStatus,
    getAllReports
};