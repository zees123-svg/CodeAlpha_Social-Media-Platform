const router = require("express").Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        .populate("followers", "username")
        .populate("following", "username");

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } 
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/:id/follow", authMiddleware, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!userToFollow)
        return res.status(404).json({ error: "User not found" });

        if (req.userId === req.params.id)
        return res.status(400).json({ error: "You cannot follow yourself" });

        if (userToFollow.followers.includes(req.userId)) {

        userToFollow.followers.pull(req.userId);
        currentUser.following.pull(req.params.id);

        await userToFollow.save();
        await currentUser.save();

        return res.json({ message: "Unfollowed user" });
    }

    userToFollow.followers.push(req.userId);
    currentUser.following.push(req.params.id);
    await userToFollow.save();
    await currentUser.save();
    res.json({ message: "Followed user" });
    } 
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id/follow", auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow || !currentUser)
            return res.status(404).json({ message: "User not found" });

        if (userToFollow.followers.includes(currentUser._id))
            return res.status(400).json({ message: "Already following" });

        userToFollow.followers.push(currentUser._id);
        currentUser.following.push(userToFollow._id);

        await userToFollow.save();
        await currentUser.save();

        res.json({ message: "User followed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put("/:id/unfollow", auth, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        userToUnfollow.followers =
            userToUnfollow.followers.filter(
                id => id.toString() !== currentUser._id.toString()
            );

        currentUser.following =
            currentUser.following.filter(
                id => id.toString() !== userToUnfollow._id.toString()
            );

        await userToUnfollow.save();
        await currentUser.save();

        res.json({ message: "User unfollowed" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;