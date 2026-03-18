import { Router } from "express"
import { verifyJWT } from "../midllewares/auth.midllewares.js"
import {
	createTweet,
	getUserTweets,
	updateTweet,
	deleteTweet
} from "../controllers/tweet.controllers.js"

const router = Router()

router.route("/").post(verifyJWT, createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet)

export default router
