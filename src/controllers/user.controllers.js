import { asyncHandler } from "../utils/asyncHandler.js";

const registerUsers = asyncHandler(async(req, res)=>{
    // get user information from frontend 
    // validation : not empty field
    // check if user allready existed  - username , email 
    // check for files that is it given by user or not : avatar , image 
    // upload it to cloudnary and check if it comes back from there or not 
    // create object user in database - store all info 
    // remove password and refersh token 
    // check for user creation 
    // send response 

    const {username , fullName , email , password} = req.body
    console.log(`email:${email}`);
    
})

export {registerUsers}