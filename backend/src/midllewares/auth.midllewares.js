import { User } from "../models/users.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const getAccessToken = (req) =>
  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

export const verifyJWT =  asyncHandler( async ( req , res , next) =>{
  try {
      const token = getAccessToken(req)
  
      if(!token){
          throw new ApiError(401 , "Unauthorized request")
      }
      const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
  
      if(!user) {
          throw new ApiError(401 , "Invalid access token")
      }
  
      req.user=user
      next()
  } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid access token" )
  }
})

export const optionalVerifyJWT = asyncHandler(async (req, res, next) => {
  const token = getAccessToken(req)

  if (!token) {
    return next()
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if (user) {
      req.user = user
    }
  } catch {
  }

  return next()
})