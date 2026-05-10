import React, { useState } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';

export default function PostCard({ post, currentUid, currentUserName, onUpdate }: { post: any, currentUid: string, currentUserName?: string, onUpdate: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const isLiked = post.likes?.includes(currentUid) || false;

  const handleLike = async () => {
    if (!currentUid) return alert("Please login first.");
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/public-space/posts/${post._id}/like`, {
        uid: currentUid
      });
      onUpdate();
    } catch (error) {
      console.error("Error liking post", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUid) return alert("Please login first.");
    if (!commentText.trim()) return;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/public-space/posts/${post._id}/comment`, {
        authorUid: currentUid,
        authorName: currentUserName || 'User',
        text: commentText
      });
      setCommentText("");
      onUpdate();
    } catch (error) {
      console.error("Error commenting", error);
    }
  };

  const handleShare = async () => {
    const shareText = `${post.authorName} on Intern Area: "${post.content}"`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Intern Area Post', text: shareText, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Post copied to clipboard!');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {post.authorPhoto ? (
          <img src={post.authorPhoto} alt="Author" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-500 font-bold">{post.authorName?.charAt(0) || 'U'}</span>
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-800">{post.authorName || 'Anonymous'}</h4>
          <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 mb-4">{post.content}</p>

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <img src={post.mediaUrl} alt="Post media" className="w-full rounded-lg mb-4 object-cover max-h-[400px]" />
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <video controls src={post.mediaUrl} className="w-full rounded-lg mb-4 max-h-[400px]" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-b py-2 mb-4">
        <button 
          onClick={handleLike} 
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition`}
        >
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
          <span>{post.likes?.length || 0} Likes</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition"
        >
          <MessageCircle size={20} />
          <span>{post.comments?.length || 0} Comments</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition ml-auto"
        >
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div>
          <div className="space-y-4 mb-4">
            {post.comments?.map((comment: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-800">{comment.authorName || 'User'}</span>
                  <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{comment.text}</p>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleComment} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition">
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
