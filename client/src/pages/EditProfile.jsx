import { Camera, Check, Link2, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/useAuth";
function EditProfile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || "", username: user?.username || "", bio: user?.bio || "", website: "" });
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const save = (e) => { e.preventDefault(); login({ ...user, ...form }); };
  return <AppShell title="Edit profile"><form onSubmit={save} className="glass-card p-6 sm:p-8"><div className="flex flex-col items-center border-b border-white/10 pb-8 sm:flex-row sm:gap-6"><div className="relative"><img className="profile-avatar !h-24 !w-24" src={user?.profilePic || "https://i.pravatar.cc/160?img=12"} alt="" /><button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500 text-white"><Camera size={16} /></button></div><div className="mt-4 text-center sm:mt-0 sm:text-left"><p className="text-xl font-black text-white">{user?.username || "your.story"}</p><p className="mt-1 text-sm text-slate-500">Update your public profile</p></div></div><div className="mt-8 grid gap-5 sm:grid-cols-2"><label><span className="form-label">Full name</span><div className="input-shell"><UserRound size={17} /><input name="fullName" value={form.fullName} onChange={update} /></div></label><label><span className="form-label">Username</span><div className="input-shell"><span className="text-slate-500">@</span><input name="username" value={form.username} onChange={update} /></div></label><label className="sm:col-span-2"><span className="form-label">Bio</span><textarea name="bio" value={form.bio} onChange={update} rows="4" className="textarea-shell" placeholder="Tell people a little about you..." /></label><label className="sm:col-span-2"><span className="form-label">Website</span><div className="input-shell"><Link2 size={17} /><input name="website" value={form.website} onChange={update} placeholder="https://" /></div></label></div><div className="mt-8 flex justify-end gap-3"><Link to="/" className="rounded-xl px-5 py-3 text-sm font-bold text-slate-400">Cancel</Link><button className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-3 text-sm font-bold text-white"><Check size={16} /> Save changes</button></div></form></AppShell>;
}
export default EditProfile;
