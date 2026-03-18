import mongoose from "mongoose"
import { Like } from "../models/like.models.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { Tweet } from "../models/tweet.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Valid video id is required")
	}

	const video = await Video.findById(videoId)
	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	const existingLike = await Like.findOne({ video: videoId, likedBy: req.user._id })

	if (existingLike) {
		await Like.findByIdAndDelete(existingLike._id)
		return res.status(200).json(new ApiResponse(200, { liked: false }, "Video unliked"))
	}

	await Like.create({ video: videoId, likedBy: req.user._id })
	return res.status(200).json(new ApiResponse(200, { liked: true }, "Video liked"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params

	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Valid comment id is required")
	}

	const comment = await Comment.findById(commentId)
	if (!comment) {
		throw new ApiError(404, "Comment not found")
	}

	const existingLike = await Like.findOne({ comment: commentId, likedBy: req.user._id })

	if (existingLike) {
		await Like.findByIdAndDelete(existingLike._id)
		return res.status(200).json(new ApiResponse(200, { liked: false }, "Comment unliked"))
	}

	await Like.create({ comment: commentId, likedBy: req.user._id })
	return res.status(200).json(new ApiResponse(200, { liked: true }, "Comment liked"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params

	if (!mongoose.Types.ObjectId.isValid(tweetId)) {
		throw new ApiError(400, "Valid tweet id is required")
	}

	const tweet = await Tweet.findById(tweetId)
	if (!tweet) {
		throw new ApiError(404, "Tweet not found")
	}

	const existingLike = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })

	if (existingLike) {
		await Like.findByIdAndDelete(existingLike._id)
		return res.status(200).json(new ApiResponse(200, { liked: false }, "Tweet unliked"))
	}

	await Like.create({ tweet: tweetId, likedBy: req.user._id })
	return res.status(200).json(new ApiResponse(200, { liked: true }, "Tweet liked"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
	const likedVideoDocs = await Like.find({
		likedBy: req.user._id,
		video: { $exists: true, $ne: null }
	})
		.populate({
			path: "video",
			populate: {
				path: "owner",
				select: "username fullName avatar"
			}
		})
		.sort({ createdAt: -1 })

	const likedVideos = likedVideoDocs
		.map((likeDoc) => likeDoc.video)
		.filter(Boolean)

	return res.status(200).json(
		new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
	)
})

export {
	toggleVideoLike,
	toggleCommentLike,
	toggleTweetLike,
	getLikedVideos
}
