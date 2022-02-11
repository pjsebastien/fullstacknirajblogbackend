const FeaturedPost = require('../models/featuredPost');
const Post = require('../models/post');
const cloudinary = require('../cloud/index');
const { isValidObjectId } = require('mongoose');
const { json } = require('express');

const FEATURED_POST_COUNT = 4;

const addToFeaturedPost = async postId => {
    const isAlreadyExist = await FeaturedPost.findOne({ post: postId });
    if (isAlreadyExist) return;

    const featuredPost = new FeaturedPost({ post: postId });
    await featuredPost.save();

    const featuredPosts = await FeaturedPost.find({}).sort({ createdAt: -1 });
    featuredPosts.forEach(async (post, index) => {
        if (index >= FEATURED_POST_COUNT) await FeaturedPost.findByIdAndDelete(post._id);
    });
};
const removeFromFeaturedPost = async postId => {
    await FeaturedPost.findOneAndDelete({ post: postId });
};

const isFeaturedPost = async postId => {
    const post = await FeaturedPost.findOne({ post: postId });
    return post ? true : false;
};

exports.createPost = async (req, res) => {
    const { title, meta, content, slug, author, tags, featured } = req.body;
    const { file } = req;
    const isAlreadyExist = await Post.findOne({ slug });

    if (isAlreadyExist) return res.status(401).json({ error: 'Utilisez un slug unique' });
    const newPost = new Post({ title, meta, content, slug, author, tags });

    if (file) {
        const { secure_url: url, public_id } = await cloudinary.uploader.upload(
            file.path,
        );
        newPost.thumbnail = { url, public_id };
    }

    await newPost.save();

    if (featured) await addToFeaturedPost(newPost._id);
    res.json({
        post: {
            id: newPost._id,
            title,
            meta,
            slug,
            thumbnail: newPost.thumbnail?.url,
            author: newPost.author,
        },
    });
};

exports.deletePost = async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId))
        return res.status(401).json({ error: 'Requête invalide' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Donnée non trouvée' });

    const public_id = post.thumbnail?.public_id;
    if (public_id) {
        const { result } = await cloudinary.uploader.destroy(public_id);

        if (result !== 'ok')
            return res.status(404).json({ error: 'Impossible de supprimer la vignette' });
    }

    await Post.findByIdAndDelete(postId);
    await removeFromFeaturedPost(postId);
    res.json({ message: 'Le post a été supprimé avec succès ! ' });
};

exports.updatePost = async (req, res) => {
    const { title, meta, content, slug, author, tags, featured } = req.body;
    const { file } = req;
    const { postId } = req.params;
    if (!isValidObjectId(postId))
        return res.status(401).json({ error: 'Requête invalide' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Donnée non trouvée' });

    const public_id = post.thumbnail?.public_id;
    if (public_id && file) {
        const { result } = await cloudinary.uploader.destroy(public_id);

        if (result !== 'ok')
            return res.status(404).json({ error: 'Impossible de supprimer la vignette' });
    }

    if (file) {
        const { secure_url: url, public_id } = await cloudinary.uploader.upload(
            file.path,
        );
        post.thumbnail = { url, public_id };
    }

    post.title = title;
    post.meta = meta;
    post.content = content;
    post.slug = slug;
    post.author = author;
    post.tags = tags;

    if (featured) await addToFeaturedPost(post._id);
    else await removeFromFeaturedPost(post._id);

    await post.save();

    res.json({
        post: {
            id: post._id,
            title,
            meta,
            slug,
            thumbnail: post.thumbnail?.url,
            author: post.author,
            content,
            featured,
            tags,
        },
    });
};

exports.getPost = async (req, res) => {
    const { slug } = req.params;
    if (!slug) return res.status(401).json({ error: 'Requête invalide' });

    const post = await Post.findOne({ slug });
    if (!post) return res.status(404).json({ error: 'Donnée non trouvée' });

    const featured = await isFeaturedPost(post._id);

    const { title, meta, content, author, tags, createdAt } = post;

    res.json({
        post: {
            id: post._id,
            title,
            meta,
            slug,
            thumbnail: post.thumbnail?.url,
            author,
            content,
            tags,
            featured,
            createdAt,
        },
    });
};

exports.getFeaturedPosts = async (req, res) => {
    const featuredPosts = await FeaturedPost.find({})
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('post');
    res.json({
        posts: featuredPosts.map(({ post }) => ({
            id: post._id,
            title: post.title,
            meta: post.meta,
            slug: post.slug,
            thumbnail: post.thumbnail?.url,
            author: post.author,
        })),
    });
};

exports.getPosts = async (req, res) => {
    const { pageNo = 0, limit = 10 } = req.query;
    //pagination
    const posts = await Post.find({})
        .sort({ createdAt: -1 })
        .skip(parseInt(pageNo) * parseInt(limit))
        .limit(parseInt(limit));
    const postCount = await Post.countDocuments();

    res.json({
        posts: posts.map(post => ({
            id: post._id,
            title: post.title,
            meta: post.meta,
            slug: post.slug,
            thumbnail: post.thumbnail?.url,
            author: post.author,
            createdAt: post.createdAt,
            tags: post.tags,
        })),
        postCount,
    });
};

exports.searchPost = async (req, res) => {
    const { title } = req.query;
    if (!title.trim())
        return res.status(401).json({ error: 'Aucun résultat de recherche ! ' });

    const posts = await Post.find({ title: { $regex: title, $options: 'i' } });

    res.json({
        posts: posts.map(post => ({
            id: post._id,
            title: post.title,
            meta: post.meta,
            slug: post.slug,
            thumbnail: post.thumbnail?.url,
            author: post.author,
            createdAt: post.createdAt,
            tags: post.tags,
        })),
    });
};

exports.getRelatedPosts = async (req, res) => {
    const { postId } = req.params;
    if (!isValidObjectId(postId))
        return res.status(401).json({ error: 'Invalid request !' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Publication non trouvée !' });

    const relatedPosts = await Post.find({
        tags: { $in: [...post.tags] },
        _id: { $ne: post._id },
    })
        .sort({ createdAt: -1 })
        .limit(5);

    res.json({
        posts: relatedPosts.map(post => ({
            id: post._id,
            title: post.title,
            meta: post.meta,
            slug: post.slug,
            thumbnail: post.thumbnail?.url,
            author: post.author,
        })),
    });
};

exports.uploadImage = async (req, res) => {
    const { file } = req;
    if (!file) return res.status(401).json({ error: 'Fichier image introuvable !' });

    const { secure_url: url } = await cloudinary.uploader.upload(file.path);

    res.status(201).json({ image: url });
};
