import { v2 as cloudinary } from "cloudinary";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} from "./env";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// Terima objek yang memiliki buffer dan mimetype
type UploadableFile = {
    buffer: Buffer;
    mimetype: string;
};

const toDataUrl = (file: UploadableFile) => {
    const b64 = file.buffer.toString("base64");
    const dataURL = `data:${file.mimetype};base64,${b64}`;
    return dataURL;
};

const getPublicIdFromFileUrl = (fileUrl: string) => {
    const fileNameUsingSubstring = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    const publicId = fileNameUsingSubstring.substring(0, fileNameUsingSubstring.lastIndexOf("."));
    return publicId;
};

export default {
    async uploadSingle(file: UploadableFile) {
        const fileDataUrl = toDataUrl(file);
        const result = await cloudinary.uploader.upload(fileDataUrl, {
            resource_type: "auto",
        });
        return result;
    },
    getPublicIdFromFileUrl
};
