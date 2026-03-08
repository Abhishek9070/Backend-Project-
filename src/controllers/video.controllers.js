import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";

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
    const {videoID} = req.params

    if(!videoID){
        throw new ApiError(400 , "VideoID must be there")
    }

    const video = await Video.findById(videoID).populate(
        "owner" ,"usernmae avatar fullName"
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
const updateVideo = asyncHandler(async(req,res)=>{
    const videoID = req.params
})

// 4) Delete video 

// 5) Get all videos 

export {
    uploadVideo,
    getVideoByID
}