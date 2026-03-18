import { Router } from "express"
import { verifyJWT } from "../midllewares/auth.midllewares.js"
import {
	getChannelStats,
	getChannelVideos
} from "../controllers/dashboard.controller.js"

const router = Router()

router.route("/stats").get(verifyJWT, getChannelStats)
router.route("/videos").get(verifyJWT, getChannelVideos)

export default router
