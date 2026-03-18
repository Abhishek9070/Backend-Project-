import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
	const { name, description } = req.body

	if (!name?.trim() || !description?.trim()) {
		throw new ApiError(400, "Name and description are required")
	}

	const playlist = await Playlist.create({
		name: name.trim(),
		description: description.trim(),
		owner: req.user._id
	})

	return res.status(201).json(
		new ApiResponse(201, playlist, "Playlist created successfully")
	)
})

const getUserPlaylists = asyncHandler(async (req, res) => {
	const { userId } = req.params
	const targetUserId = userId || req.user._id

	if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
		throw new ApiError(400, "Valid user id is required")
	}

	const playlists = await Playlist.find({ owner: targetUserId })
		.populate("owner", "username fullName avatar")
		.populate("video", "title thumbnail duration views")
		.sort({ createdAt: -1 })

	return res.status(200).json(
		new ApiResponse(200, playlists, "Playlists fetched successfully")
	)
})

const getPlaylistById = asyncHandler(async (req, res) => {
	const { playlistId } = req.params

	if (!mongoose.Types.ObjectId.isValid(playlistId)) {
		throw new ApiError(400, "Valid playlist id is required")
	}

	const playlist = await Playlist.findById(playlistId)
		.populate("owner", "username fullName avatar")
		.populate({
			path: "video",
			populate: {
				path: "owner",
				select: "username fullName avatar"
			}
		})

	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	return res.status(200).json(
		new ApiResponse(200, playlist, "Playlist fetched successfully")
	)
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params

	if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Valid playlist id and video id are required")
	}

	const [playlist, video] = await Promise.all([
		Playlist.findById(playlistId),
		Video.findById(videoId)
	])

	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	if (!video) {
		throw new ApiError(404, "Video not found")
	}

	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only edit your own playlist")
	}

	const alreadyExists = playlist.video.some((item) => item.toString() === videoId)
	if (!alreadyExists) {
		playlist.video.push(videoId)
		await playlist.save({ validateBeforeSave: false })
	}

	const updatedPlaylist = await Playlist.findById(playlistId)
		.populate("owner", "username fullName avatar")
		.populate("video", "title thumbnail duration views")

	return res.status(200).json(
		new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
	)
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params

	if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "Valid playlist id and video id are required")
	}

	const playlist = await Playlist.findById(playlistId)

	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only edit your own playlist")
	}

	playlist.video = playlist.video.filter((item) => item.toString() !== videoId)
	await playlist.save({ validateBeforeSave: false })

	const updatedPlaylist = await Playlist.findById(playlistId)
		.populate("owner", "username fullName avatar")
		.populate("video", "title thumbnail duration views")

	return res.status(200).json(
		new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
	)
})

const updatePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params
	const { name, description } = req.body

	if (!mongoose.Types.ObjectId.isValid(playlistId)) {
		throw new ApiError(400, "Valid playlist id is required")
	}

	const playlist = await Playlist.findById(playlistId)

	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only edit your own playlist")
	}

	if (name?.trim()) playlist.name = name.trim()
	if (description?.trim()) playlist.description = description.trim()

	await playlist.save({ validateBeforeSave: false })

	return res.status(200).json(
		new ApiResponse(200, playlist, "Playlist updated successfully")
	)
})

const deletePlaylist = asyncHandler(async (req, res) => {
	const { playlistId } = req.params

	if (!mongoose.Types.ObjectId.isValid(playlistId)) {
		throw new ApiError(400, "Valid playlist id is required")
	}

	const playlist = await Playlist.findById(playlistId)

	if (!playlist) {
		throw new ApiError(404, "Playlist not found")
	}

	if (playlist.owner.toString() !== req.user._id.toString()) {
		throw new ApiError(403, "You can only delete your own playlist")
	}

	await Playlist.findByIdAndDelete(playlistId)

	return res.status(200).json(
		new ApiResponse(200, {}, "Playlist deleted successfully")
	)
})

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	updatePlaylist,
	deletePlaylist
}
