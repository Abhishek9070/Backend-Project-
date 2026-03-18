import { Video } from "../models/video.models.js"
import { Like } from "../models/like.models.js"
import { Subscription } from "../models/subscription.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
	const ownerId = req.user._id

	const [videos, totalSubscribers] = await Promise.all([
		Video.find({ owner: ownerId }).select("_id views"),
		Subscription.countDocuments({ channel: ownerId })
	])

	const totalVideos = videos.length
	const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)
	const videoIds = videos.map((video) => video._id)

	const totalLikes = videoIds.length
		? await Like.countDocuments({ video: { $in: videoIds } })
		: 0

	return res.status(200).json(
		new ApiResponse(200, {
			totalVideos,
			totalViews,
			totalSubscribers,
			totalLikes
		}, "Channel stats fetched successfully")
	)
})

const getChannelVideos = asyncHandler(async (req, res) => {
	const ownerId = req.user._id

	const videos = await Video.find({ owner: ownerId })
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, videos, "Channel videos fetched successfully")
	)
})

export {
	getChannelStats,
	getChannelVideos
}
