const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        meta: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        tags: [String],
        author: {
            type: String,
            default: 'Admin',
        },
        thumbnail: {
            type: Object,
            url: {
                type: URL,
            },
            public_id: {
                type: String,
            },
        },
        // category,
        // region,
        // services,
        // lat,
        // long,
        // description,
        // link,
        // price,
        // isActive
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Post', postSchema);
