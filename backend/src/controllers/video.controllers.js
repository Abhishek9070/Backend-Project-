import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/users.models.js";
import { Like } from "../models/like.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const GUEST_VIEW_COOKIE_KEY = "guestViewedVideos"
const MAX_GUEST_VIEW_ITEMS = 80
const guestViewCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 180
}

const parseGuestViewedVideos = (rawValue) => {
    if (!rawValue || typeof rawValue !== "string") {
        return []
    }

    return [...new Set(
        rawValue
            .split(",")
            .map((value) => value.trim())
            .filter((value) => mongoose.Types.ObjectId.isValid(value))
    )].slice(0, MAX_GUEST_VIEW_ITEMS)
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { q = "", page = 1, limit = 12, ownerId } = req.query

    const parsedPage = Math.max(Number(page) || 1, 1)
    const parsedLimit = Math.min(Math.max(Number(limit) || 12, 1), 50)

    const filter = {
        isPublished: true
    }

    if (q?.trim()) {
        filter.$or = [
            { title: { $regex: q.trim(), $options: "i" } },
            { description: { $regex: q.trim(), $options: "i" } }
        ]
    }

    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
        filter.owner = ownerId
    }

    const [videos, total] = await Promise.all([
        Video.find(filter)
            .populate("owner", "username fullName avatar")
            .sort({ createdAt: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit),
        Video.countDocuments(filter)
    ])

    return res.status(200).json(
        new ApiResponse(200, {
            items: videos,
            page: parsedPage,
            limit: parsedLimit,
            total,
            totalPages: Math.ceil(total / parsedLimit)
        }, "Videos fetched successfully")
    )
})

//1) Upload video 

const uploadVideo = asyncHandler(async (req , res) =>{
    console.log("uploadVideo: received files", {
        bodyKeys: Object.keys(req.body || {}),
        fileKeys: Object.keys(req.files || {}),
        videoFile: req.files?.videoFile?.[0]?.path || null,
        thumbnail: req.files?.thumbnail?.[0]?.path || null
    })

    // Get all meta data related video
    const {description , title } = req.body
    if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required")
    }

    // Finding the local path of the video
    const videoPath = req.files?.videoFile?.[0]?.path
    const thumbnailPath = req.files?.thumbnail?.[0]?.path

    //Checking if its uploaded or not 
    if(!videoPath){
        throw new ApiError (400 , "Sry no video found please upload it again")
    }

    const video = await cloudinaryUpload(videoPath, { resourceType: "video" })
    const thumbnail = await cloudinaryUpload(thumbnailPath, { resourceType: "image" })

    console.log("uploadVideo: cloudinary result", {
        videoUrl: video?.url || null,
        thumbnailUrl: thumbnail?.url || null,
        videoError: video?.error || null,
        thumbnailError: thumbnail?.error || null
    })

    if(!video?.url){
        throw new ApiError(500,"Video upload failed")
    }

    const videoData = await  Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail?.url || "",
        duration: video.duration || 0,
        owner: req.user._id
    })

    return res.status(201).json(
            new ApiResponse(201 ,videoData , "Video uploaded successfully")
    )

})

// 2) View Video 
const getVideoByID = asyncHandler(async (req , res) =>{
    const {videoId} = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Valid video id is required")
    }

    const video = await Video.findById(videoId).populate(
        "owner" ,"username avatar fullName"
    )

    if(!video){
        throw new ApiError(401 , "No Video found")
    }

    let viewRecorded = false

    if (req.user?._id) {
        const watchUpdate = await User.updateOne(
            { _id: req.user._id },
            { $addToSet: { watchHistory: video._id } }
        )

        if (watchUpdate.modifiedCount > 0) {
            viewRecorded = true
        }
    } else {
        const viewedVideoIds = parseGuestViewedVideos(req.cookies?.[GUEST_VIEW_COOKIE_KEY])

        if (!viewedVideoIds.includes(videoId)) {
            viewRecorded = true

            const updatedViewedVideoIds = [videoId, ...viewedVideoIds]
                .slice(0, MAX_GUEST_VIEW_ITEMS)

            res.cookie(
                GUEST_VIEW_COOKIE_KEY,
                updatedViewedVideoIds.join(","),
                guestViewCookieOptions
            )
        }
    }

    if (viewRecorded) {
        video.views += 1
        await Video.updateOne({ _id: video._id }, { $inc: { views: 1 } })
    }

    const [likesCount, dislikesCount, commentsCount, viewerReaction] = await Promise.all([
        Like.countDocuments({ video: video._id, isDislike: { $ne: true } }),
        Like.countDocuments({ video: video._id, isDislike: true }),
        Comment.countDocuments({ video: video._id }),
        req.user?._id
            ? Like.findOne({ video: video._id, likedBy: req.user._id }).select("isDislike")
            : null
    ])

    const payload = video.toObject()
    payload.likesCount = likesCount
    payload.dislikesCount = dislikesCount
    payload.commentsCount = commentsCount
    payload.isLiked = viewerReaction ? !viewerReaction.isDislike : false
    payload.isDisliked = Boolean(viewerReaction?.isDislike)
    payload.viewRecorded = viewRecorded

    return res.status(200).json(
        new ApiResponse(200, payload, "Video fetched successfully")
    )
})


// 3) Update video (description)
const updateVideo = asyncHandler(async(req , res)=>{
    const {videoId} = req.params
    const {description , title} = req.body

    if(!videoId) {
        throw new ApiError(401 , "VideoID required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401 ,"Video not found")
    }

    if(video.owner.toString() != req.user._id.toString()){
        throw new ApiError(401 , "You are not supposed to edit this")
    }

    if(title) video.title=title
    if(description) video.description=description

    const thumbnailPath = req.file?.path

    if(thumbnailPath){
        const updateThumbnail = await cloudinaryUpload(thumbnailPath, { resourceType: "image" })
        video.thumbnail = updateThumbnail?.url || video.thumbnail
    }

     await video.save({validateBeforeSave : false})

    return res.status(200).json(
        new ApiResponse(200, video, "Video edited sucessfull")
    )
})

// 4) Delete video 
const deleteVideo = asyncHandler(async(req , res)=>{
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(401,"Video ID is not present")
    }
    
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404 , "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404 , "Video not found")
    }

    await cloudinaryDelete(video.videoFile)
    if(video.thumbnail){
        await cloudinaryDelete(video.thumbnail)
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200,{},"Video Deleted Successfully")
    )
})
// 5) Get all videos 

export {
    getAllVideos,
    uploadVideo,
    getVideoByID,
    updateVideo,
    deleteVideo
}