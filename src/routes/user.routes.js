import {Router} from "express";
import { loginUsers , logOutUsers, registerUsers } from "../controllers/user.controllers.js";
import { upload } from "../midllewares/cloudinary.midlewares.js";
import { verifyJWT } from "../midllewares/auth.midllewares.js";

const router = Router()

router.route("/register").post( // as we have to send data to cloudnarry before registering the user so we will use it 
    upload.fields([ // here we get multiple options with upload. but we select fields bcs we can send any type of file by this in an array 
        {
            name: "avatar", // defining the name of that file should be equal in both frontend and backend
            maxCount: 1  // define how many files max you can send 
        },
        {
            name: "coverImage",
            maxCount: 2
        }
    ]),
    registerUsers)

router.route("/login").post(loginUsers)

// secure route 
router.route("/logOut").post(verifyJWT , logOutUsers)
export default router