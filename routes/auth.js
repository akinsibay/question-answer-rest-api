const express = require("express");

const router = express.Router();
const photoUpload = require("../config/js/multer");

// Controller Functionality
const {
    register,
    login,
    logout,
    getLoggedInUser,
    imageUpload,
    updateDetails
} = require("../controllers/auth");
const getAccessToRoute = require("../middlewares/authorization/auth");


router.post("/register",register);
router.post("/login",login);
router.get("/logout",getAccessToRoute,logout);
router.get("/user",getAccessToRoute,getLoggedInUser);
router.post("/upload",[getAccessToRoute,photoUpload.single("profile_image")],imageUpload)
router.post("/updatedetails",getAccessToRoute,updateDetails);


module.exports = router;
