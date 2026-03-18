import { Router } from "express"
import { verifyJWT } from "../midllewares/auth.midllewares.js"
import {
	toggleSubscription,
	getUserChannelSubscribers,
	getSubscribedChannels
} from "../controllers/subscription.controllers.js"

const router = Router()

router.route("/toggle/:channelId").post(verifyJWT, toggleSubscription)
router.route("/channel/:channelId").get(getUserChannelSubscribers)
router.route("/me").get(verifyJWT, getSubscribedChannels)

export default router
