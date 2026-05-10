import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { auth, storage } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import PostCard from '../../component/PostCard';
import { ImagePlus, Video, AlertCircle, UserPlus, Users } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PublicSpace() {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Post form state
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Add friend state
  const [friendUid, setFriendUid] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/public-space/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchDbUser = async (uid: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uid}`);
      setDbUser(res.data);
    } catch (error) {
      console.error("Error fetching db user", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Sync user with our DB to get friends and limits
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sync`, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
          setDbUser(res.data);
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
      // Await posts fetch before setting loading false
      await fetchPosts();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dbUser) { toast.error("Please login first."); return; }
    if (!content.trim() && !file) { toast.error("Please add some content or attach a file."); return; }

    setUploading(true);
    try {
      let mediaUrl = "";
      let mediaType = "none";

      if (file) {
        const fileRef = ref(storage, `public_space/${Date.now()}_${file.name}`);
        const uploadTask = await uploadBytesResumable(fileRef, file);
        mediaUrl = await getDownloadURL(uploadTask.ref);
        mediaType = file.type.startsWith("video") ? "video" : "image";
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/public-space/posts`, {
        authorUid: user.uid,
        content,
        mediaUrl,
        mediaType
      });

      setContent("");
      setFile(null);
      // Clear both photo and video inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";

      toast.success("Post published!");

      // Refresh posts and user limits
      await fetchPosts();
      await fetchDbUser(user.uid);
    } catch (error: any) {
      console.error("Error creating post", error);
      toast.error(error.response?.data?.error || "Error creating post");
    } finally {
      setUploading(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first."); return; }
    if (!friendUid.trim()) { toast.error("Please enter a Friend UID."); return; }
    if (friendUid.trim() === user.uid) { toast.error("You cannot add yourself as a friend."); return; }
    setAddingFriend(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/add-friend`, {
        uid: user.uid,
        friendUid: friendUid.trim()
      });
      toast.success("Friend added! Your posting limit has been updated.");
      setFriendUid("");
      await fetchDbUser(user.uid);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add friend.");
    } finally {
      setAddingFriend(false);
    }
  };

  // Calculate posting limits based on friend count
  const friendCount = dbUser?.friends?.length || 0;
  let dailyLimit: number | "Unlimited" = 0;
  if (friendCount === 0) dailyLimit = 0;
  else if (friendCount === 1) dailyLimit = 1;
  else if (friendCount >= 2 && friendCount <= 10) dailyLimit = 2;
  else dailyLimit = "Unlimited"; // > 10 friends

  const postsToday = dbUser?.postCountToday || 0;
  const remaining: number | "Unlimited" =
    dailyLimit === "Unlimited" ? "Unlimited" : Math.max(0, dailyLimit - postsToday);

  const canPost = remaining === "Unlimited" || (remaining as number) > 0;

  if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading Public Space...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Public Space 🌍</h1>
        <p className="text-lg text-gray-600">Connect, share, and engage with the community.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar: User Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Profile</h2>
            {!user ? (
              <div className="text-gray-500 text-sm">Please login to see your stats and create posts.</div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{user.displayName}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Users size={14} /> {friendCount} Friend{friendCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Posting Limits Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  <h4 className="font-medium text-blue-800 mb-2 text-sm">Posting Limits</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className={friendCount === 0 ? 'font-bold' : ''}>0 Friends → 0 Posts/day</li>
                    <li className={friendCount === 1 ? 'font-bold' : ''}>1 Friend → 1 Post/day</li>
                    <li className={friendCount >= 2 && friendCount <= 10 ? 'font-bold' : ''}>2–10 Friends → 2 Posts/day</li>
                    <li className={friendCount > 10 ? 'font-bold' : ''}>11+ Friends → Unlimited</li>
                  </ul>
                </div>

                {/* Today's Usage */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 font-medium text-sm">Daily Limit:</span>
                    <span className="font-bold text-gray-900 text-sm">{dailyLimit}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600 font-medium text-sm">Posted Today:</span>
                    <span className="font-bold text-gray-700 text-sm">{postsToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Remaining:</span>
                    <span className={`font-bold text-sm ${!canPost ? 'text-red-500' : 'text-green-600'}`}>
                      {remaining}
                    </span>
                  </div>
                </div>

                {/* Add Friend Panel */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                    <UserPlus size={16} className="text-blue-600" /> Add a Friend
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">Enter a friend's User ID to add them and unlock higher posting limits.</p>
                  <form onSubmit={handleAddFriend} className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Paste friend's UID here"
                      value={friendUid}
                      onChange={(e) => setFriendUid(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <button
                      type="submit"
                      disabled={addingFriend}
                      className="w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      {addingFriend ? 'Adding...' : 'Add Friend'}
                    </button>
                  </form>
                  {/* Show own UID so others can add them */}
                  <div className="mt-3 bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-400 mb-1">Your UID (share with friends):</p>
                    <p className="text-xs font-mono text-gray-600 break-all select-all">{user.uid}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content: Create Post & Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Form */}
          {user && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Create a Post</h3>
              {!canPost ? (
                <div className="flex items-start gap-3 bg-amber-50 text-amber-700 p-4 rounded-lg border border-amber-200">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Daily posting limit reached</p>
                    <p className="text-xs mt-1">
                      {friendCount === 0
                        ? "You need at least 1 friend to start posting. Add friends using the panel on the left."
                        : `You've used all ${dailyLimit} post(s) for today. Add more friends to increase your limit!`}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePostSubmit}>
                  <textarea
                    placeholder="What's on your mind?"
                    className="w-full border border-gray-200 rounded-lg p-4 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-gray-800"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />

                  {file && (
                    <div className="mb-4 flex items-center justify-between text-sm text-green-700 bg-green-50 border border-green-200 p-2 rounded-lg">
                      <span>📎 {file.name}</span>
                      <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; if (videoInputRef.current) videoInputRef.current.value = ""; }} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
                        <ImagePlus size={22} />
                        <span className="hidden sm:inline text-sm">Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
                        <Video size={22} />
                        <span className="hidden sm:inline text-sm">Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          ref={videoInputRef}
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      {remaining !== "Unlimited" && (
                        <span className="text-xs text-gray-400">{remaining} post{(remaining as number) !== 1 ? 's' : ''} left today</span>
                      )}
                      <button
                        type="submit"
                        disabled={uploading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {uploading ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Posts Feed */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Posts</h3>
            {posts.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-md">
                No posts yet. Be the first to share something!
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUid={user?.uid}
                  currentUserName={user?.displayName || 'User'}
                  onUpdate={fetchPosts}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
