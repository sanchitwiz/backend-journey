import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token! ")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "testing postman"
    // })

    // get details from the user (frontend)
    // validation - not empty
    // check if user already exists
    // check for images, check for avatar
    // upload them to cloudinary, avatar uploaded or not?
    // create user Object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation
    // return response
    
    const {fullname, email, username, password } = req.body
    // console.log("email: ", email);

    // if(fullname === ""){
    //     throw new ApiError(400, "Full Name is Required")
    // }

    if ([fullname, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All Fields are Required!");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with Email and Username already Exists!");
    }
    
    // Extract file paths safely
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    // Ensure avatar file exists
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is Required!");
    }
    
    let avatar, coverImage;
    try {
        // Upload avatar to Cloudinary
        avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(500, "Failed to upload avatar to Cloudinary!");
        }
    
        // Upload cover image only if provided
        if (coverImageLocalPath) {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
        }
    } catch (error) {
        console.error("Error uploading files:", error);
    
        // Cleanup local files in case of failure
        try {
            if (avatarLocalPath && fs.existsSync(avatarLocalPath)) {
                fs.unlinkSync(avatarLocalPath);
            }
            if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) {
                fs.unlinkSync(coverImageLocalPath);
            }
        } catch (cleanupError) {
            console.error("Error cleaning up local files:", cleanupError);
        }
    
        throw new ApiError(500, "Error uploading files to Cloudinary!");
    }

    const user = await User.create({
        fullname, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password, 
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User Created Sucessfully ")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    //---------------------------ToDos---------------------------
    // req body se data le aao
    // username/email and password exists
    // find the user
    // password check
    // access and refreshToken generate
    // send cookies
    // send res "sucessfully logged in"

    const {email, username, password} = req.body
    if(!(username || email)){
        throw new ApiError(400, "Email or Username is Required!")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User Doesn't Exist !")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!user){
        throw new ApiError(401, "Invalid User Credentials !")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedUser = User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(
            200,
            {
                user: loggedUser, accessToken, refreshToken
            },
            "User Logged in Sucessfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User LoggedOut Sucessfully"))
})

export { registerUser, loginUser, logoutUser }