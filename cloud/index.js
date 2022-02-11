const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dcngcvz9k',
    api_key: '276766973725624',
    api_secret: 'pBmiJGF8_jFxbsNmFG3kZuc20ng',
    //Ne marche pas avec les variables d'env ...
    // cloud_name: process.env.CLOUD_NAME,
    // api_key: process.env.CLOUD_API_KEY,
    // api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

module.exports = cloudinary;
