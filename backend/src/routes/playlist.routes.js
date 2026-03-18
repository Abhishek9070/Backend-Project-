import { Router } from "express"
import { verifyJWT } from "../midllewares/auth.midllewares.js"
import {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	updatePlaylist,
	deletePlaylist
} from "../controllers/playlist.controllers.js"

const router = Router()

router.route("/").post(verifyJWT, createPlaylist)
router.route("/me").get(verifyJWT, getUserPlaylists)
router.route("/user/:userId").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById).patch(verifyJWT, updatePlaylist).delete(verifyJWT, deletePlaylist)
router.route("/add/:playlistId/:videoId").patch(verifyJWT, addVideoToPlaylist)
router.route("/remove/:playlistId/:videoId").patch(verifyJWT, removeVideoFromPlaylist)

export default router
