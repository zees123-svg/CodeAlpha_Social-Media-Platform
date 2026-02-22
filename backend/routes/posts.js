const router = require("express").Router();
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, async (req, res) => {
    try {
        const post = await Post.create({
            content: req.body.content,
            user: req.userId
        });
        res.json(post);
    } 
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", async (req, res) => {
    const posts = await Post.find()
    .populate("user", "username")
    .populate("comments");
    res.json(posts);
});

router.post("/:id/like", authMiddleware, async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post.likes.includes(req.userId)) {
        post.likes.push(req.userId);
        await post.save();
    }

    res.json(post);
});

router.post("/:id/comment", authMiddleware, async (req, res) => {
    const comment = await Comment.create({
        user: req.userId,
        post: req.params.id,
        text: req.body.text
    });

    const post = await Post.findById(req.params.id);
    post.comments.push(comment._id);
    await post.save();

    res.json(comment);
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post)
            return res.status(404).json({ error: "Post not found" });

        if (post.user.toString() !== req.userId)
            return res.status(403).json({ error: "Unauthorized" });

        await post.deleteOne();

        res.json({ message: "Post deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;