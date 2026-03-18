import { Router } from "express"
import { verifyJWT } from "../midllewares/auth.midllewares.js"
import {
	toggleVideoLike,
	toggleCommentLike,
	toggleTweetLike,
	getLikedVideos
} from "../controllers/likes.controllers.js"

const router = Router()

router.route("/toggle/video/:videoId").post(verifyJWT, toggleVideoLike)
router.route("/toggle/comment/:commentId").post(verifyJWT, toggleCommentLike)
router.route("/toggle/tweet/:tweetId").post(verifyJWT, toggleTweetLike)
router.route("/videos").get(verifyJWT, getLikedVideos)

export default router
