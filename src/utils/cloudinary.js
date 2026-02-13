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
            console.log("Uploading file:", localFilePath)
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            console.log("Upload successful:", response.url)
            fs.unlinkSync(localFilePath)
            return response
        }
        catch(error){
            console.log("Cloudinary upload error:", error.message)
            // Only try to delete if file exists
            if(localFilePath && fs.existsSync(localFilePath)){
                fs.unlinkSync(localFilePath)
            }
            return null
        }
    }

export {cloudinaryUpload}