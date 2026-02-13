import { Cloudinary } from '@cloudinary/url-gen';
import { fill, scale } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';

// Initialize Cloudinary instance
export const cld = new Cloudinary({
    cloud: {
        cloudName: 'dlpzdoznd'
    }
});

// Helper to get image object
export const getCloudinaryImage = (publicId) => {
    // We use the publicId exactly as provided by the user to avoid guessing paths/extensions
    // User should provide the "Public ID" from Cloudinary dashboard (e.g., "pantcookie-assets/image1" or "image1_xyz")
    const myImage = cld.image(publicId);

    // Apply default optimizations
    myImage
        .delivery(format('auto'))
        .delivery(quality('auto'));

    return myImage;
};

// Helper for thumbnail generation
export const getCloudinaryThumbnail = (publicId, width = 400, height = 300) => {
    const myImage = cld.image(publicId);

    myImage
        .resize(fill().width(width).height(height).gravity(autoGravity()))
        .delivery(format('auto'))
        .delivery(quality('auto'));

    return myImage;
};

// Helper for video
export const getCloudinaryVideo = (publicId) => {
    const myVideo = cld.video(publicId);

    myVideo
        .delivery(format('auto'))
        .delivery(quality('auto'));

    return myVideo;
};

// Helper to get raw URL string (for CSS backgrounds, canvas, etc.)
export const getCloudinaryUrl = (publicId) => {
    const myImage = cld.image(publicId);

    myImage
        .delivery(format('auto'))
        .delivery(quality('auto'));

    return myImage.toURL();
};
