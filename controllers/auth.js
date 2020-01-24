const User = require("../models/User");
const errorWrapper = require("../helpers/errorWrapper");
const CustomError = require("../helpers/customError");
const bcrypt = require("bcryptjs");
const sendMail = require("../helpers/sendEmail");


/*
@description : Register New User
@access : Public - Everyone can access this functionality
@route  : {{URL}}/api/v1/auth/register 
@method : POST
*/

// Error Handler Makalesi - https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const register =  errorWrapper(async (req,res,next) => {
  
    const {name,email,password,role} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    sendTokenToClient(user,res,200);

   
    
});
const login = errorWrapper(async (req,res,next) => {

    const {email,password} = req.body;
    
    if(!validateUserInput(email,password)) {
        return next(new CustomError("Please check your inputs",400));
    }
    
    const user = await User.findOne({email}).select("+password");

    if ( !user || !checkPassword(password,user.password)) {
        
        return next(new CustomError("Please check your credentials",404));
    }


    sendTokenToClient(user,res,200);
    

});
const getLoggedInUser = errorWrapper(async (req,res,next)=>{

    res.status(200).json({
        success : true,
        data : req.user
    });


});
const logout = errorWrapper(async (req,res,next) =>{
   
    const {JWT_COOKIE_EXPIRE,NODE_ENV} = process.env;
    
    // Send To Client With Res
    
    return res
    .status(200)
    .cookie("token",null, {
        httpOnly : true,
        expires : new Date(Date.now()),
        secure : NODE_ENV === "development" ? false : true
    })
    .json({
        success : true,
        message : "Logout Successfull"
    });
    
});
const imageUpload = errorWrapper(async (req,res,next) => {
    
    const user = await User.findByIdAndUpdate(req.user.id,{
        "profile_image" : req.savedImage
    },{
        new: true,
        runValidators : true
    });
    res.status(200)
    .json({
        success : true,
        message : "Photo Upload Successful"
    });

});

const updateDetails = errorWrapper(async (req,res,next) => {

    const updateDetails = req.body;

    const user = await User.findByIdAndUpdate(req.user.id,updateDetails,{
        new : true,
        runValidators : true
    });

    res
    .status(200)
    .json({
        success : true,
        message : "Details Updated",
        data : user
    });
});

const forgotPassword = errorWrapper(async (req,res,next) => {

    const resetEmail = req.body.email;

    // Check Email

    const user = await User.findOne({email: resetEmail});

    if (!user) {
        return next(new CustomError("User Not Found With That Email",400));

    }
    const resetPasswordToken = user.getResetPasswordToken();
    console.log(resetPasswordToken);
    console.log(user);

    await user.save();

    
    const resetPasswordUrl = `http://localhost:5000/api/v1/auth/resetPassword?resetPasswordToken=${resetPasswordToken}`;


    const emailTemplate = `
        <h3>Reset Your Password</h3>
        <p>This <a href = '${resetPasswordUrl}' target = '_blank'>link</a>  will expire in 1 hour</p>
        
    `;
    try {
        await sendMail({
            from: process.env.SMTP_EMAIL, // sender address
            to: resetEmail, // list of receivers
            subject: "Reset Password Token", // Subject line
            html: emailTemplate // html body
        });
        return res.status(200)
        .json({
            success : true,
            message : "Email Sent",
            data : user
        });
    }
    catch(err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        user.save();

        return next(new CustomError("Email Could Not Be Sent",500));
    }
    return res.status(200)
    .json({
        success : true,
            message : "Email Sent",
            data : user
    });
    
    
});
const validateUserInput = (email,password) => email && password;
const checkPassword = (password,hashedPassword) => {

    return bcrypt.compareSync(password, hashedPassword);

}
const sendTokenToClient =  (user,res,status) => {

    // Get Token From User Model
    const token =  user.getTokenFromUserModel();

    const {JWT_COOKIE_EXPIRE,NODE_ENV} = process.env;
    
    // Send To Client With Res
    
    return res
    .status(status)
    .cookie("token",token, {
        httpOnly : true,
        expires : new Date(Date.now() +  parseInt(JWT_COOKIE_EXPIRE) * 1000 * 60),
        secure : NODE_ENV === "development" ? false : true
    })
    .json({
        success : true,
        token,
        data : {
            name : user.name,
            email : user.email,
            role : user.role
        }
    });
    

}

module.exports = {
    register,
    login,
    logout,
    imageUpload,
    getLoggedInUser,
    updateDetails,
    forgotPassword
};



