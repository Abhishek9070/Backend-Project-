import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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

    const video = await cloudinaryUpload(videoPath)
    const thumbnail = await cloudinaryUpload(thumbnailPath)

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

    if(!videoId){
        throw new ApiError(400 , "VideoID must be there")
    }

    const video = await Video.findById(videoId).populate(
        "owner" ,"username avatar fullName"
    )

    if(!video){
        throw new ApiError(401 , "No Video found")
    }

    video.views+=1
    await video.save({ validateBeforeSave : false })

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
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
        const updateThumbnail = await cloudinaryUpload(thumbnailPath)
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