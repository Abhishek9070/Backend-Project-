import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { URL } from "url"

const LARGE_UPLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024


// Configuration (env var names kept to match existing .env keys)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
})

const cloudinaryUpload = async (localFilePath, options = {}) => {
    try {
        if (!localFilePath) return null

        const { resourceType = "auto" } = options
        const fileStats = fs.existsSync(localFilePath) ? fs.statSync(localFilePath) : null
        const fileSize = fileStats?.size || 0
        const shouldUseLargeUpload = fileSize > LARGE_UPLOAD_THRESHOLD_BYTES && resourceType !== "image"

        console.log("Uploading file:", localFilePath)
        const response = shouldUseLargeUpload
            ? await cloudinary.uploader.upload_large(localFilePath, {
                resource_type: resourceType === "auto" ? "video" : resourceType,
                chunk_size: 6 * 1024 * 1024
            })
            : await cloudinary.uploader.upload(localFilePath, {
                resource_type: resourceType
            })

        console.log("Upload successful:", response.secure_url || response.url)

        try {
            if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)
        } catch (e) {
            console.warn("Failed to remove local temp file:", e.message)
        }

        return response
    } catch (error) {
        console.log("Cloudinary upload error:", error?.message || error)
        // Only try to delete if file exists
        try {
            if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath)
        } catch (e) {
            console.warn("Failed to remove local temp file after error:", e.message)
        }
        // Throw the error so upstream handlers and logs receive the original message
        throw new Error(error?.message || String(error))
    }
}

const cloudinaryDelete = async (imageUrl) => {
    try {
        if (!imageUrl) return null

        // Robustly extract public_id from a Cloudinary URL.
        // Example URL: https://res.cloudinary.com/<cloud>/image/upload/v123/folder1/folder2/public_id.ext
        let publicId = null
        try {
            const parsed = new URL(imageUrl)
            const pathname = parsed.pathname || ""
            const uploadIndex = pathname.indexOf("/upload/")
            if (uploadIndex >= 0) {
                // slice after /upload/
                let remainder = pathname.slice(uploadIndex + "/upload/".length)
                // remove version segment if present (/v123/)
                remainder = remainder.replace(/^v\d+\//, "")
                // remove leading / if any
                if (remainder.startsWith("/")) remainder = remainder.slice(1)
                // remove file extension
                const lastDot = remainder.lastIndexOf('.')
                publicId = lastDot > 0 ? remainder.slice(0, lastDot) : remainder
            }
        } catch (e) {
            // Fallback: try a naive extraction
            const parts = imageUrl.split("/")
            const fileWithExt = parts[parts.length - 1] || ""
            publicId = fileWithExt.split('.')[0]
        }

        if (!publicId) return null

        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Cloudinary delete result:", result)
        return result
    } catch (error) {
        console.log("Cloudinary delete error:", error?.message || error)
        return null
    }
}

export { cloudinaryUpload, cloudinaryDelete }