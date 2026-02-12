import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { cloudinaryUpload } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    if( [username , fullName , email , password].some(
        (fields)=> fields?.trim()==="") // if this is empty then it will return true
    ){
        throw new ApiError(400 , "All fields requires") // throwing error using apierror 
    }

    // 3) Existance checking : for that we have imported User model as it is the only way to talk to our database 
    // So on that user we run a preDefined method .findOne which returns the first existance of the user
    const existingUser=User.findOne({
        $or:[{email},{username}] // here as we want to check from both if either of them exists you cant register , so by using ($) we can basically use or and xor and many other function , all inside an array of objects
    })

    if( existingUser ){ // as we store it in a var then here with help of it we can check 
        throw new ApiError(409 , "User allready registered")
    }

    // 4) checking needed file like avatar or coverimage is uploaded by user or not 

    const avatarLocalPath = req.files?.avatar[0]?.path;
     // as we are using multer as our middleware so it will proive us funtion to take files data 
     // it is good practice to check at all stages like is we are getting the file or not 
     // then we  extract the path (local path) of the image which is sotre in an array as its first element , there are other data about the image there also 
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
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
        avatar:avatar.url(), // here we just want avatar url not other metadata about it 
        coverImg:coverImg?.url || "" // see we dont check if there is coverImg as it not required so check it here if present then send url and if not then keep it empty
    })

    // 7 - 8) Check for user creation & removing password and refereshToken
    // Checking if the user data is available in our DB , checking them by finding the user id (which is provided by mDB)
    // There are other ways to validate this , as here we are making to much DB calls but if you cnt ptovide any function then whats the need to optimise it 
    // But we get an advance feature here as we dont want to send password and refreshToken so we can do a 
    // chainig using .select and inside it we will pass the things which we want to remove , 
    // but it will be in form of string and a -(minus) in starting of it 
    const createUser = User.findById(user._id).select(
        "-password - refreshToken"
    )

    if(!createUser){
        throw new ApiError(500 , "Something went wrong while creating the user")
    }

    // 9) sending response 
    return res.status(201).json(
        new ApiResponse(200 , createUser , "User Registered succesfully") // used the structured response file
    )

})


export {registerUsers}