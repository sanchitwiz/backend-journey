import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

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

    if(
        [fullname, email, username, password].some( (field) => field.trim() === "true")
    ){
        throw ApiError(400, "All Fields are Required !")
    }

    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with Email and Username already Exists !")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatar){
        throw new ApiError(400 , "Avatar file is Required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400 , "Avatar file is Required!")
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

export { registerUser }