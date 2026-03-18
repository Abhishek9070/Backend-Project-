import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import { Video } from "../models/video.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Valid video id is required")
	}

	const comments = await Comment.find({ video: videoId })
		.populate("owner", "username fullName avatar")
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, comments, "Comments fetched successfully")
	)
})

const addComment = asyncHandler(async (req, res) => {
	const { videoId } = req.params
	const { comment } = req.body

	if (!mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Valid video id is required")
	}

	if (!comment?.trim()) {
		throw new ApiError(400, "Comment is required")
	}

	const video = await Video.findById(videoId)
	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	const newComment = await Comment.create({
		comment: comment.trim(),
		video: videoId,
		owner: req.user._id
	})

	const createdComment = await Comment.findById(newComment._id)
		.populate("owner", "username fullName avatar")

	return res.status(201).json(
		new ApiResponse(201, createdComment, "Comment added successfully")
	)
})

const updateComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params
	const { comment } = req.body

	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Valid comment id is required")
	}

	if (!comment?.trim()) {
		throw new ApiError(400, "Updated comment is required")
	}

	const existingComment = await Comment.findById(commentId)
	if (!existingComment) {
		throw new ApiError(404, "Comment not found")
	}

	if (existingComment.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only edit your own comments")
	}

	existingComment.comment = comment.trim()
	await existingComment.save({ validateBeforeSave: false })

	const updatedComment = await Comment.findById(commentId)
		.populate("owner", "username fullName avatar")

	return res.status(200).json(
		new ApiResponse(200, updatedComment, "Comment updated successfully")
	)
})

const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params

	if (!mongoose.Types.ObjectId.isValid(commentId)) {
		throw new ApiError(400, "Valid comment id is required")
	}

	const existingComment = await Comment.findById(commentId)
	if (!existingComment) {
		throw new ApiError(404, "Comment not found")
	}

	if (existingComment.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only delete your own comments")
	}

	await Promise.all([
		Like.deleteMany({ comment: commentId }),
		Comment.findByIdAndDelete(commentId)
	])

	return res.status(200).json(
		new ApiResponse(200, {}, "Comment deleted successfully")
	)
})

export {
	getVideoComments,
	addComment,
	updateComment,
	deleteComment
}
