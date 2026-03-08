import {Router} from "express";
import { 
    loginUsers, 
    logOutUsers, 
    refreshAccessToken, 
    registerUsers,
    changePassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImg,
    userProfileDisplay,
    userWatchHistory
} from "../controllers/user.controllers.js";
import { upload } from "../midllewares/cloudinary.midlewares.js";
import { verifyJWT } from "../midllewares/auth.midllewares.js";

const router = Router()

// public routes
router.route("/register").post( 
    upload.fields([ 
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUsers
)

router.route("/login").post(loginUsers)
router.route("/refresh-token").post(refreshAccessToken) // no verifyJWT - token is expired when refreshing

// secured routes (require authentication)
router.route("/logout").post(verifyJWT, logOutUsers)
router.route("/change-password").post(verifyJWT, changePassword)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)

router.route("/cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImg
)

router.route("/c/:username").get(verifyJWT, userProfileDisplay)
router.route("/watch-history").get(verifyJWT, userWatchHistory)

export default router