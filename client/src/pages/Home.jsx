import { Heart, MessageCircle, MoreHorizontal, Play, Send, ImagePlus, Bookmark, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import api from "../api/axios";

const demoPosts = [
  { _id: "demo-1", user: { username: "maya.makes", profilePic: "https://i.pravatar.cc/160?img=47" }, caption: "A little color therapy for the middle of the week. What are you making space for lately?", image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1000&q=85", likes: ["1", "2", "3"], comments: [{ text: "This is so peaceful ✨" }] },
  { _id: "demo-2", user: { username: "arjun.travels", profilePic: "https://i.pravatar.cc/160?img=11" }, caption: "No itinerary, just follow the light.", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85", likes: ["1", "2"], comments: [{ text: "Adding this to my list." }] },
];

function Stories() {
  const stories = [
    ["Your story", "https://i.pravatar.cc/120?img=12", true],
    ["sana.jpg", "https://i.pravatar.cc/120?img=32"],
    ["leo.lines", "https://i.pravatar.cc/120?img=15"],
    ["nora.notes", "https://i.pravatar.cc/120?img=44"],
    ["theo.cooks", "https://i.pravatar.cc/120?img=68"],
  ];
  return <div className="glass-card mb-6 flex gap-5 overflow-x-auto p-5 scrollbar-none">{stories.map(([name, src, own]) => <button key={name} className="min-w-[58px] text-center"><div className={`story-ring mx-auto mb-2 ${own ? "story-own" : ""}`}><img src={src} alt="" />{own && <span className="story-plus"><Plus size={12} /></span>}</div><span className="block truncate text-[11px] text-slate-400">{name}</span></button>)}</div>;
}

function Composer() {
  return <div className="glass-card mb-6 p-5"><div className="flex gap-3"><img className="avatar-sm" src="https://i.pravatar.cc/120?img=12" alt="" /><div className="flex-1"><button className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-slate-500">What’s on your mind today?</button><div className="mt-4 flex items-center justify-between"><div className="flex gap-1"><button className="composer-action"><ImagePlus size={17} /> Photo</button><button className="composer-action"><Play size={16} /> Reel</button></div><button className="rounded-xl bg-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/20">Share</button></div></div></div></div>;
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return <article className="glass-card mb-6 overflow-hidden">
    <div className="flex items-center justify-between p-5"><Link to={`/profile/${post.user._id || "demo"}`} className="flex items-center gap-3"><img className="avatar-sm" src={post.user.profilePic} alt="" /><div><p className="text-sm font-bold text-white">{post.user.username}</p><p className="mt-0.5 text-xs text-slate-500">2h ago · Mumbai</p></div></Link><button className="icon-button"><MoreHorizontal size={19} /></button></div>
    <img className="post-image" src={post.image} alt={post.caption} />
    <div className="p-5"><div className="mb-4 flex items-center justify-between"><div className="flex gap-1"><button className={`post-action ${liked ? "text-rose-400" : ""}`} onClick={() => setLiked(!liked)}><Heart size={20} fill={liked ? "currentColor" : "none"} /></button><button className="post-action"><MessageCircle size={20} /></button><button className="post-action"><Send size={19} /></button></div><button className={`post-action ${saved ? "text-amber-300" : ""}`} onClick={() => setSaved(!saved)}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button></div><p className="text-sm font-bold text-white">{(post.likes?.length || 0) + (liked ? 1 : 0)} likes</p><p className="mt-2 text-sm leading-6 text-slate-300"><span className="mr-2 font-bold text-white">{post.user.username}</span>{post.caption}</p><button className="mt-3 text-xs font-semibold text-slate-500">View all {post.comments?.length || 1} comments</button></div>
  </article>;
}

function Home() {
  const [posts, setPosts] = useState(demoPosts);
  useEffect(() => { api.get("/posts").then(({ data }) => { if (data.posts?.length) setPosts(data.posts); }).catch(() => {}); }, []);
  return <AppShell title="Your feed"><Stories /><Composer /><div className="mb-5 flex items-center justify-between"><p className="text-sm font-semibold text-slate-400">Latest from your circle</p><button className="text-xs font-bold text-fuchsia-300">View all</button></div>{posts.map((post) => <PostCard key={post._id} post={post} />)}</AppShell>;
}

export default Home;
