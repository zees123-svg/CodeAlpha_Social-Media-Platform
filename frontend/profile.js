const API_USERS = "http://localhost:5000/api/users";
const API_POSTS = "http://localhost:5000/api/posts";

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "login.html";
}

const currentUserId = localStorage.getItem("currentUserId");

const urlParams = new URLSearchParams(window.location.search);
const idFromURL = urlParams.get("id");

let profileUserId = idFromURL || localStorage.getItem("profileUserId") || currentUserId;

async function handleResponse(res) {
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}

async function loadProfile(userId) {
    profileUserId = userId;
    localStorage.setItem("profileUserId", profileUserId);

    const res = await fetch(`${API_USERS}/${userId}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    const user = await res.json();

    document.getElementById("username").textContent = user.username;
    document.getElementById("bio").textContent = user.bio || "";
    document.getElementById("followersCount").textContent = user.followers.length;
    document.getElementById("followingCount").textContent = user.following.length;

    if (profileUserId === currentUserId) {
        document.getElementById("followBtn").style.display = "none";
    } else {
        document.getElementById("followBtn").style.display = "inline";
        document.getElementById("followBtn").textContent =
            user.followers.some(f => f._id === currentUserId) ? "Unfollow" : "Follow";
    }

    loadPosts();
}

function viewProfile(userId) {
    localStorage.setItem("profileUserId", userId);
    loadProfile(userId);
}

async function loadPosts() {
    const res = await fetch(`${API_POSTS}?user=${profileUserId}`);
    const posts = await res.json();
    const postsDiv = document.getElementById("userPosts");
    postsDiv.innerHTML = "";

    posts.forEach(post => {
        postsDiv.innerHTML += `
            <div class="post">
                <p>
                    <a href="profile.html?id=${post.user._id}" class="username-link">
                        ${post.user.username}
                    </a>
                </p>

                <p>${post.content}</p>

                <button onclick="likePost('${post._id}')">
                    Like (${post.likes.length})
                </button>
                ${post.user._id === currentUserId ? 
                    `<button onclick="deletePost('${post._id}')">Delete</button>` 
                    : ""}

                <br><br>

                <input id="comment-${post._id}" placeholder="Add comment"/>
                <button onclick="addComment('${post._id}')">Comment</button>
                <div>
                    ${post.comments.map(c => `<p>${c.text}</p>`).join("")}
                </div>

                <hr>
            </div>
        `;
    });
}

async function likePost(postId) {
    try {
        const res = await fetch(`${API_POSTS}/${postId}/like`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        await handleResponse(res);
        loadPosts();
    } catch (err) {
        alert(err.message);
    }
}

async function addComment(postId) {
    const text = document.getElementById(`comment-${postId}`).value.trim();
    if (!text) return alert("Comment cannot be empty");

    try {
        const res = await fetch(`${API_POSTS}/${postId}/comment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });

        await handleResponse(res);

        document.getElementById(`comment-${postId}`).value = "";
        loadPosts();
    } catch (err) {
        alert(err.message);
    }
}

async function toggleFollow() {
    try {
        const isFollowing =
            document.getElementById("followBtn").textContent === "Unfollow";

        const url = `${API_USERS}/${profileUserId}/${isFollowing ? "unfollow" : "follow"}`;

        const res = await fetch(`${API_USERS}/${profileUserId}/follow`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        loadProfile(profileUserId); 
    } catch (err) {
        alert(err.message);
    }
}

async function createPost() {
    const content = document.getElementById("newPostContent").value.trim();
    if (!content) return alert("Post cannot be empty");

    try {
        const res = await fetch(API_POSTS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        await handleResponse(res);

        document.getElementById("newPostContent").value = "";
        loadPosts();
    } catch (err) {
        alert(err.message);
    }
}

async function deletePost(postId) {

    if (!confirm("Are you sure you want to delete this post?"))
        return;

    try {
        const res = await fetch(`${API_POSTS}/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        await handleResponse(res);

        loadPosts();

    } catch (err) {
        alert(err.message);
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("profileUserId");

    window.location.href = "login.html";
}

loadProfile(profileUserId);