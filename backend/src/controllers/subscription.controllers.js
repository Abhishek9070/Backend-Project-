import mongoose from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import { User } from "../models/users.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params

	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		throw new ApiError(400, "Valid channel id is required")
	}

	if (channelId === req.user._id.toString()) {
		throw new ApiError(400, "You cannot subscribe to your own channel")
	}

	const channel = await User.findById(channelId)
	if (!channel) {
		throw new ApiError(404, "Channel not found")
	}

	const existingSubscription = await Subscription.findOne({
		channel: channelId,
		subscriber: req.user._id
	})

	if (existingSubscription) {
		await Subscription.findByIdAndDelete(existingSubscription._id)
		return res.status(200).json(
			new ApiResponse(200, { subscribed: false }, "Channel unsubscribed")
		)
	}

	await Subscription.create({
		channel: channelId,
		subscriber: req.user._id
	})

	return res.status(200).json(
		new ApiResponse(200, { subscribed: true }, "Channel subscribed")
	)
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params

	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		throw new ApiError(400, "Valid channel id is required")
	}

	const subscribers = await Subscription.find({ channel: channelId })
		.populate("subscriber", "username fullName avatar")
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, subscribers, "Subscribers fetched successfully")
	)
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
	const userId = req.user._id

	const subscribedChannels = await Subscription.find({ subscriber: userId })
		.populate("channel", "username fullName avatar")
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
	)
})

export {
	toggleSubscription,
	getUserChannelSubscribers,
	getSubscribedChannels
}
