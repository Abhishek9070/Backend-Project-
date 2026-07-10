import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: Number(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000 // default 7 days
}


const  creatAccessTokenAndRefereshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken // entring into our db 
        await user.save({validateBeforeSave : false})// just update the db without any check
        
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating accessToken and refereshToken")
    }
}

const registerUsers = asyncHandler( async ( req , res ) => {
    // get user information from frontend 
    // validation : not empty field
    // check if user allready existed  - username , email 
    // check for files that is it given by user or not : avatar , image 
    // upload it to cloudnary and check if it comes back from there or not 
    // create object user in database - store all info 
    // remove password and refersh token 
    // check for user creation 
    // send response 


    // 1) Taking data from frontend 
    const { username , fullName , email , password } = req.body || {}
    const normalizedUsername = username?.trim().toLowerCase()
    const normalizedEmail = email?.trim().toLowerCase()
    console.log(`email:${email}`);
    
    // 2) validation userData 

    //M1 : Here we have write multiple if condition for everything , its ok but lengthy 
    // if(username==""){
    //     throw new ApiError(400 , "Enter full username")
    // }

    // M2 : using array .some() method -> which returns true and false , we will insert all data in an array and run check for each data all together 
    // In real project there is a seperate file for this validation we just import and use as there can be as many validation checks 
    
    if( [normalizedUsername, fullName, normalizedEmail, password].some(
        (field)=> !field || field?.trim()==="")
    ){
        throw new ApiError(400 , "All fields are required") // throwing error using apierror 
    }

    // 3) Existance checking : for that we have imported User model as it is the only way to talk to our database 
    // So on that user we run a preDefined method .findOne which returns the first existance of the user
    
    const existingUser= await User.findOne({
        $or:[{email: normalizedEmail},{username: normalizedUsername}]
    })

    if( existingUser ){ // as we store it in a var then here with help of it we can check 
        throw new ApiError(409 , "User allready registered")
    }

    // 4) checking needed file like avatar or coverimage is uploaded by user or not 
    console.log("req.files:", req.files)
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
     // as we are using multer as our middleware so it will proive us funtion to take files data 
     // it is good practice to check at all stages like is we are getting the file or not 
     // then we  extract the path (local path) of the image which is sotre in an array as its first element , there are other data about the image there also 
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    // making sure is there image given by the user 
    if(!avatarLocalPath) {
        throw new ApiError(400 , "Avatar file is required");
    }

    // 5) Uploading it to cloudnary
    const avatar = await cloudinaryUpload(avatarLocalPath)
    const coverImg = await cloudinaryUpload(coverImageLocalPath)

    if(avatar?.error){
        throw new ApiError(400, `Avatar upload failed: ${avatar.error}`)
    }

    if(!avatar?.url){
        throw new ApiError(400 , "Avatar file is required");
    }

    if(coverImg?.error){
        console.log("Cover image upload failed:", coverImg.error)
    }

    // 6) Entering user data in our database 
    const user = await User.create({
        fullName,
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        avatar: avatar.url, // here we just want avatar url not other metadata about it 
        coverImage: coverImg?.url || "" // cover image is optional
    })

    // 7 - 8) Check for user creation & removing password and refereshToken
    // Checking if the user data is available in our DB , checking them by finding the user id (which is provided by mDB)
    // There are other ways to validate this , as here we are making to much DB calls but if you cnt ptovide any function then whats the need to optimise it 
    // But we get an advance feature here as we dont want to send password and refreshToken so we can do a 
    // chainig using .select and inside it we will pass the things which we want to remove , 
    // but it will be in form of string and a -(minus) in starting of it 
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createUser){
        throw new ApiError(500 , "Something went wrong while creating the user")
    }

    // 9) sending response 
    return res.status(201).json(
        new ApiResponse(201 , createUser , "User Registered succesfully") // used the structured response file
    )

})

const loginUsers = asyncHandler ( async ( req, res ) => {
    // bring given username , email , password from frontend  (req->body)
    const {username , email , password}=req.body || {}
    const normalizedUsername = username?.trim().toLowerCase()
    const normalizedEmail = email?.trim().toLowerCase()
    if( !(normalizedUsername || normalizedEmail) ){
        throw new ApiError(400 ,"Please enter username or email")
    }
    //username or email validate 
    const userDetails = await User.findOne({
        $or:[{username: normalizedUsername} , {email: normalizedEmail}]
    }).select("+password")
    //check if user is registered or not 
    if(!userDetails){
        throw new ApiError(404,"User not found please register")
    }

    //password validate 
    const isPasswordValid=await userDetails.isPasswordCorrect(password) // here we have used our own method which we created for the user inside db 
    // which basically checks for the correctness of password , but the main  point here is we can acces this mehod into the userDetails only not in Users
    // bcs its directly comes from db on which we have applied the method 
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user Credentials ")
    }
    //create access token & refresh token
    const {accessToken , refreshToken } = await creatAccessTokenAndRefereshToken(userDetails._id)
    
    const logInUser = await User.findById(userDetails._id).
    select("-password -refreshToken") // here basically we are removing the things which we dont want to send
    
    // send tokens as secure httpOnly cookies AND include accessToken in JSON response for frontend
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
        new ApiResponse(
            200,
            { accessToken, userDetails: logInUser },
            "User logged in successfully"
        )
    )
})

const logOutUsers = asyncHandler( async ( req , res ) => {
    // as we need to logout user so that at first we need to see who is the user ,
    // on that basis we will then remove the refresh token , cookies 
    // but as when we are logging the user then we take reference from the username , email and all other stuf to get them login
    // but while logginout we cant do this that you give me name/email or anyhting 
    // Then how ? 
    // we have to use middleware (our own ) here ,
    //  whose work is just to check is user is logged in or not and
    //  if logged in then we will add a method in it by which we can acess the user directly with help of req.users

    await User.findByIdAndUpdate(
        req.user._id,
        {
           $unset:{
            refreshToken:1
           }
        },{
            new:true 
        }
    )
    return res
    .status(200)
    .clearCookie("accessToken" , cookieOptions)
    .clearCookie("refreshToken" , cookieOptions)
    .json( new ApiResponse(200 , {} , "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async ( req , res ) =>{
    try {
        const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    
        if(!incommingRefreshToken){
            throw new ApiError(401 , "Unauthorized access ")
        }
    
        const decodedToken =  jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
             throw new ApiError(401 , "Invalid refresh token")
        }
    
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token expired or used")
        }
    
        const {accessToken , refreshToken: newRefreshToken} = await creatAccessTokenAndRefereshToken(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(200, {}, "New refresh token generated")
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }

})

const changePassword = asyncHandler(async ( req , res ) =>{
    // So for changing the password we must check is user log in or not and for that we will use our auth middleware which we wrote earlier
    
    const {oldPassword , newPassword , cnfrmPassword} = req.body || {} 

    if(!(newPassword === cnfrmPassword)){
        throw new ApiError(400 ,"newPassword and cnfrmPassword is not same")
    }

    const user = await User.findById(req.user._id).select("+password")
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Incorect password")
    }

    if(oldPassword===newPassword){
        throw new ApiError(400 , "Old password and New password can not be same")
    }
    user.password=newPassword
    await user.save({
        validateBeforeSave : false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200 , {} ,"Password changed successfully")
    )


})

const updateAccountDetails = asyncHandler( async ( req , res ) => {

    const {fullName , email} = req.body || {}

    if(!fullName || !email){
        throw new ApiError(400 , "Fill all the given fields to update")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                fullName,
                email 
                // fullName : fullName 
                // email : email
            }        
        },
        {new:true}
    ).select("-password -refreshToken")
    
    res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler ( async ( req , res ) =>{
    const newAvatarLocalPath = req.file?.path
    if(!newAvatarLocalPath){
        throw new ApiError(400 ,"Avatar image is required")
    }

    // Get old avatar URL to delete after successful upload
    const oldUser = await User.findById(req.user?._id)
    const oldAvatarUrl = oldUser?.avatar

    const avatar = await  cloudinaryUpload(newAvatarLocalPath)

    if(!avatar.url){
        throw new ApiError(401 , "Error while uploading avatar")
    }

    // Delete old avatar from cloudinary
    if(oldAvatarUrl){
        await cloudinaryDelete(oldAvatarUrl)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar : avatar.url
            }
        },
        {new:true}
    ).select("-password")

     return res
    .status(200)
    .json(new ApiResponse(200 , user , "Avatar updated sucessfully"))
})

const updateUserCoverImg = asyncHandler ( async ( req , res ) =>{
    const newCoverImgLocalPath = req.file?.path
    if(!newCoverImgLocalPath){
        throw new ApiError(400 ,"Cover image is required")
    }

    // Get old cover image URL to delete after successful upload
    const oldUser = await User.findById(req.user?._id)
    const oldCoverImgUrl = oldUser?.coverImage

    const coverImage = await  cloudinaryUpload(newCoverImgLocalPath)

    if(!coverImage.url){
        throw new ApiError(401 , "Error while uploading coverImage")
    }

    // Delete old cover image from cloudinary
    if(oldCoverImgUrl){
        await cloudinaryDelete(oldCoverImgUrl)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage : coverImage.url // we have to just update the string not insert whole obj
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Cover Image updated sucessfully"))
})

// Here we are going to display the profile of the user which will have :-
//  Username , FullName , avatar , coverimage , subscriber count , subscribed count , subscribe or subscribed option for each channel 
const userProfileDisplay = asyncHandler ( async ( req , res ) =>{
    const {username} = req.params // as we will extract username from the url 

    if(!username?.trim()){
        throw new ApiError(400 , "Username not found")
    }
    // applying aggregation pipline to extract the username then finding the subscriber count and other stufs 
    const channel = await User.aggregate([ 

        {
            $match : { // here we extract a document on this basis we have to do look up 
                username : username?.toLowerCase()
            }
        },
        {
            $lookup:{ // finding subscribers 
                from :"subscriptions", // as in db it is stored in plural form 
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup:{ // finding the channel which i subscribed 
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields:{ // adding both field to user model 
                subscriberCount :{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size :"$subscribedTo"
                },
                isSubscribed:{
                    $cond : {
                        if :{ $in : [ req.user._id , "$subscribers.subscriber" ] },
                        then : true ,
                        else : false

                    }
                }
            }
        },
        {
            $project:{ // sending data which we want to display 
                username:1,
                fullName:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel dont exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})

const userWatchHistory = asyncHandler ( async ( req , res ) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200 ,
        user[0].watchHistory ,
        "Watch history fetched successfully"))
})
export {registerUsers,
        loginUsers,
        logOutUsers,
        refreshAccessToken,
        changePassword,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImg,
        userProfileDisplay,
        userWatchHistory
}