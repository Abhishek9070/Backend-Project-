import { Router } from "express";
import { upload } from "../midllewares/cloudinary.midlewares.js";
import { verifyJWT } from "../midllewares/auth.midllewares.js";
import {
    getAllVideos,
    uploadVideo,
    getVideoByID,
    updateVideo,
    deleteVideo
    
} from "../controllers/video.controllers.js"

const router = Router()

router.route("/").get(getAllVideos)

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
router.patch(
   "/edit/:videoId",
   verifyJWT,
   upload.single("thumbnail"),
   updateVideo
)
router.route("/delete/:videoId").delete(
    verifyJWT,
    deleteVideo
)
export default router