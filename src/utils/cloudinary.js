import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded sucessfully
        // console.log("File is Uplaoded on Cloudinary !", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        // Delete the local file if upload fails
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (err) {
            console.error("Failed to delete local file after upload failure:", err);
        }

        return null;
    }
}

export {uploadOnCloudinary}