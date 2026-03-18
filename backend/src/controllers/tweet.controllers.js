import mongoose from "mongoose"
import { Tweet } from "../models/tweet.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
	const { content } = req.body

	if (!content?.trim()) {
		throw new ApiError(400, "Tweet content is required")
	}

	const tweet = await Tweet.create({
		content: content.trim(),
		owner: req.user._id
	})

	const createdTweet = await Tweet.findById(tweet._id)
		.populate("owner", "username fullName avatar")

	return res.status(201).json(
		new ApiResponse(201, createdTweet, "Tweet created successfully")
	)
})

const getUserTweets = asyncHandler(async (req, res) => {
	const { userId } = req.params

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError(400, "Valid user id is required")
	}

	const tweets = await Tweet.find({ owner: userId })
		.populate("owner", "username fullName avatar")
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, tweets, "Tweets fetched successfully")
	)
})

const updateTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params
	const { content } = req.body

	if (!mongoose.Types.ObjectId.isValid(tweetId)) {
		throw new ApiError(400, "Valid tweet id is required")
	}

	if (!content?.trim()) {
		throw new ApiError(400, "Updated tweet content is required")
	}

	const tweet = await Tweet.findById(tweetId)

	if (!tweet) {
		throw new ApiError(404, "Tweet not found")
	}

	if (tweet.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only edit your own tweet")
	}

	tweet.content = content.trim()
	await tweet.save({ validateBeforeSave: false })

	return res.status(200).json(
		new ApiResponse(200, tweet, "Tweet updated successfully")
	)
})

const deleteTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params

	if (!mongoose.Types.ObjectId.isValid(tweetId)) {
		throw new ApiError(400, "Valid tweet id is required")
	}

	const tweet = await Tweet.findById(tweetId)

	if (!tweet) {
		throw new ApiError(404, "Tweet not found")
	}

	if (tweet.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only delete your own tweet")
	}

	await Promise.all([
		Like.deleteMany({ tweet: tweetId }),
		Tweet.findByIdAndDelete(tweetId)
	])

	return res.status(200).json(
		new ApiResponse(200, {}, "Tweet deleted successfully")
	)
})

export {
	createTweet,
	getUserTweets,
	updateTweet,
	deleteTweet
}
