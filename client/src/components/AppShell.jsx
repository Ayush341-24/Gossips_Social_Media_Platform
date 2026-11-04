import { Bell, Compass, Home, LogOut, MessageCircle, Plus, Search, Sparkles, UserRound } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const avatar = "https://i.pravatar.cc/160?img=12";

function AppShell({ children, title = "Home" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentUser = user || { username: "you", profilePic: avatar };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const nav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/search", label: "Discover", icon: Compass },
    { to: `/profile/${currentUser._id || currentUser.id || "me"}`, label: "Profile", icon: UserRound },
  ];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1380px] items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="brand-mark"><Sparkles size={18} /></span>
            <span className="hidden text-xl font-black tracking-tight sm:block">gossips<span className="text-fuchsia-400">.</span></span>
          </Link>
          <div className="hidden w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 md:flex">
            <Search size={17} className="text-slate-500" />
            <Link to="/search" className="text-sm text-slate-500">Search people, moments, trends...</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
            <button className="icon-button hidden sm:flex" aria-label="Messages"><MessageCircle size={19} /></button>
            <button onClick={handleLogout} className="icon-button" aria-label="Log out"><LogOut size={18} /></button>
            <Link to={`/profile/${currentUser._id || currentUser.id || "me"}`} className="avatar-ring">
              <img src={currentUser.profilePic || avatar} alt="Your profile" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1380px] grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)_290px] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-2">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? "side-link-active" : ""}`}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
            <button className="side-link w-full" onClick={() => navigate("/")}>
              <Plus size={20} /> Create post
            </button>
            <div className="my-7 h-px bg-white/10" />
            <p className="px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">Your space</p>
            <NavLink to="/edit-profile" className="side-link"><Sparkles size={20} /> Edit profile</NavLink>
          </nav>
          <p className="mt-16 px-4 text-xs leading-5 text-slate-600">© 2026 Gossips<br />Made for real conversations.</p>
        </aside>

        <main className="min-w-0">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="eyebrow">Good to see you</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">{title}</h1>
            </div>
            <Link to="/" className="hidden text-sm font-semibold text-fuchsia-300 sm:block">Fresh for you ↗</Link>
          </div>
          {children}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-5">
            <div className="glass-card overflow-hidden p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-bold text-white">Trending now</p>
                <Compass size={17} className="text-fuchsia-300" />
              </div>
              {["#slowmornings", "#streetstories", "#buildinpublic"].map((tag, index) => (
                <div key={tag} className="mb-4 flex items-center justify-between last:mb-0">
                  <div><p className="text-sm font-semibold text-slate-200">{tag}</p><p className="mt-1 text-xs text-slate-500">{index + 2}.4k conversations</p></div>
                  <span className="text-xs text-slate-600">0{index + 1}</span>
                </div>
              ))}
            </div>
            <div className="gradient-card p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Sparkles size={20} /></div>
              <p className="text-lg font-bold text-white">Make your corner of the internet feel like home.</p>
              <p className="mt-2 text-sm leading-6 text-white/65">Share the small things. They are usually the big things.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AppShell;
