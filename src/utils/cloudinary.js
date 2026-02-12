import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNARY_CLOUD_API_KEY, 
        api_secret: process.env.CLOUDNARY_CLOUD_API_SECRET
    });
    
    const cloudinaryUpload= async (localFilePath)=>{
        try{
            if(!localFilePath) return null
            const response = cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            fs.unlink(localFilePath)
            return response
        }
        catch(error){
            fs.unlink(localFilePath)
            return null
        }
    }

return {cloudinaryUpload}