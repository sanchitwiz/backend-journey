import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from '../middleware/multer.middleware.js';

const router = Router();

router.route("/register").post(
    //now you can send images using multer
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
    registerUser
)

export default router;