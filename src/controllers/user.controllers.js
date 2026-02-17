import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { cloudinaryUpload } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt, { decode } from "jsonwebtoken"


const  creatAccessTokenAndRefereshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken // entring into our db 
        await user.save({validateBeforeSave : false})// just update the db without any check
        
        return {accessToken,refereshToken}
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
    const { username , fullName , email , password } = req.body
    console.log(`email:${email}`);
    
    // 2) validation userData 

    //M1 : Here we have write multiple if condition for everything , its ok but lengthy 
    // if(username==""){
    //     throw new ApiError(400 , "Enter full username")
    // }

    // M2 : using array .some() method -> which returns true and false , we will insert all data in an array and run check for each data all together 
    // In real project there is a seperate file for this validation we just import and use as there can be as many validation checks 
    if( [!username || !fullName || !email || !password].some(
        (fields)=> fields?.trim()==="") // if this is empty then it will return true
    ){
        throw new ApiError(400 , "All fields requires") // throwing error using apierror 
    }

    // 3) Existance checking : for that we have imported User model as it is the only way to talk to our database 
    // So on that user we run a preDefined method .findOne which returns the first existance of the user
    const existingUser= await User.findOne({
        $or:[{email},{username}] // here as we want to check from both if either of them exists you cant register , so by using ($) we can basically use or and xor and many other function , all inside an array of objects
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
    // sending the local path there and storing it in a variable and again checking is it there or not for better error handling 
    const avatar= await cloudinaryUpload(avatarLocalPath)
    const coverImg = await cloudinaryUpload(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required");
    }

    // 6) Entering user data in our database 
    const user = await User.create({
        fullName,
        username:username.toLowerCase(), // we want that all username should be in lowecase in my db
        email,
        password,
        avatar:avatar.url, // here we just want avatar url not other metadata about it 
        coverImg:coverImg?.url || "" // see we dont check if there is coverImg as it not required so check it here if present then send url and if not then keep it empty
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
    const {username , email , password}=req.body
    if( !(username || email) ){
        throw new ApiError(400 ,"Please enter username or email")
    }
    //username or email validate 
    const userDetails = await User.findOne({
        $or:[{username} , {email}]
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
    //create access token & referesh token
    const {accessToken , refereshToken } = await creatAccessTokenAndRefereshToken(userDetails._id)
    
    const logInUser = await User.findById(userDetails._id).
    select("-password -refreshToken") // here basically we are removing the things which we dont want to send
    
    //send both the tokens to user in form of cookie (secure cookie)

    //setting oprions for cookie as if we directly send it then it can be modified from frontend but now it will only be modified from the server 
    const options={
        httpOnly : true ,
        secure : true
    }

    //give response
    return res
    .status(200)
    .cookie("accessToken",accessToken , options)
    .cookie("refreshToken" , refereshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                userDetails : logInUser , accessToken , refereshToken
            },
            "User loged in successfully"
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
    const options={
        httpOnly : true ,
        secure : true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json( new ApiResponse(200 , {} , "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async ( req , res ) =>{
    try {
        const incommingRefreshToken = req.cookie.refereshToken || req.body.refereshToken
    
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
    
        if(incommingRefreshToken !== user?.refereshToken){
            throw new ApiError(401 , "Refresh token expired or used")
        }
    
        const {accessToken , newrefereshToken} = generateAccessToken(user._id)
        
        const options={
            httpOnly : true ,
            secure : true
        }
        
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken",newrefereshToken , options)
        .json(
            new ApiResponse (200, {
                accessToken,
                refereshToken:newrefereshToken
            } ,"New refresh token generated")
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }

})

const changePassword = asyncHandler(async ( req , res ) =>{
    // So for changing the password we must check is user log in or not and for that we will use our auth middleware which we wrote earlier
    
    const {oldPassword , newPassword , cnfrmPassword} = req.body 

    if(!(newPassword === cnfrmPassword)){
        throw new ApiError(400 ,"newPassword and cnfrmPassword is not same")
    }

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(200 , "Incorect password")
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

    const {fullName , email} = req.body

    if(!fullName || !email){
        throw new ApiError(200 , "Fill all the given fields to update")
    }

    const user = User.findByIdAndUpdate(
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
    ).select("-password -refereshToken")
    
    res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated successfully"))
})
export {registerUsers,
        loginUsers,
        logOutUsers,
        refreshAccessToken,
        changePassword
}