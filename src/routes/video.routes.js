import { Router } from "express";
import { upload } from "../midllewares/cloudinary.midlewares.js";
import { verifyJWT } from "../midllewares/auth.midllewares.js";
import {
    uploadVideo,
    getVideoByID
    
} from "../controllers/video.controllers.js"

const router = Router()

router.route("/upload-video").post(
    verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount : 1
        },
         {
            name:"thumbnail",
            maxCount : 1
        }
    ]),
    uploadVideo
)

router.route("/watch/:videoId").get(getVideoByID)

export default router