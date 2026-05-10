const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');

const isSameDay = (d1, d2) => {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' };
  const d1Str = new Date(d1).toLocaleString('en-US', options);
  const d2Str = new Date(d2).toLocaleString('en-US', options);
  return d1Str === d2Str;
}

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create a post
router.post('/posts', async (req, res) => {
    try {
        const { authorUid, content, mediaUrl, mediaType } = req.body;
        if (!authorUid || !content) return res.status(400).json({ error: 'Author and content required' });

        const user = await User.findOne({ uid: authorUid });
        if (!user) return res.status(404).json({ error: 'User not found. Please login first.' });

        // Reset post count if it's a new day
        const today = new Date();
        if (!user.lastPostDate || !isSameDay(user.lastPostDate, today)) {
            user.postCountToday = 0;
            user.lastPostDate = today;
        }

        const friendCount = user.friends.length;
        let limit = 0;
        if (friendCount === 0) limit = 0;
        else if (friendCount === 1) limit = 1;
        else if (friendCount >= 2 && friendCount <= 10) limit = 2;
        else limit = Infinity; // > 10 friends: unlimited

        if (limit === 0) {
            return res.status(403).json({ 
                error: 'You need at least 1 friend to post. Add friends to unlock posting!' 
            });
        }

        if (user.postCountToday >= limit && limit !== Infinity) {
            return res.status(403).json({ 
                error: `Daily limit reached. You have ${friendCount} friend(s), allowing ${limit} post(s) per day. Come back tomorrow or add more friends!` 
            });
        }

        const newPost = new Post({
            authorUid,
            authorName: user.displayName,
            authorPhoto: user.photoURL,
            content,
            mediaUrl,
            mediaType
        });
        await newPost.save();

        user.postCountToday += 1;
        await user.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Like a post
router.post('/posts/:id/like', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'UID is required to like a post' });
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const likeIndex = post.likes.indexOf(uid);
        if (likeIndex === -1) {
            post.likes.push(uid);
        } else {
            post.likes.splice(likeIndex, 1);
        }
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Comment on a post
router.post('/posts/:id/comment', async (req, res) => {
    try {
        const { authorUid, authorName, text } = req.body;
        if (!authorUid) return res.status(400).json({ error: 'Author UID is required' });
        if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text cannot be empty' });
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        post.comments.push({
            authorUid,
            authorName,
            text,
            createdAt: new Date()
        });
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
