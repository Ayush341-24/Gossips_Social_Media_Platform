import { ArrowRight, Mail, Lock, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import { useAuth } from "../context/useAuth";

function Register() {
  const [form, setForm] = useState({ username: "", fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await registerUser(form);
      localStorage.setItem("token", data.token);
      login(data.user);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not create your account.");
    } finally { setLoading(false); }
  };
  return <div className="auth-page min-h-screen px-5 py-8"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1fr_430px]"><div className="hidden lg:block"><Link to="/" className="mb-20 inline-flex items-center gap-3 text-xl font-black text-white"><span className="brand-mark">✦</span> gossips<span className="text-fuchsia-400">.</span></Link><p className="eyebrow">A softer social network</p><h1 className="mt-5 max-w-xl text-7xl font-black leading-[0.98] tracking-[-0.06em] text-white">Bring your <span className="gradient-text">whole self.</span></h1><p className="mt-7 max-w-md text-lg leading-8 text-slate-400">A place for the little moments, honest thoughts, and people who make ordinary days feel brighter.</p></div><div className="glass-card p-7 sm:p-10"><Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">← Back home</Link><p className="eyebrow">Start your story</p><h2 className="mt-2 text-3xl font-black text-white">Create an account</h2><p className="mt-2 text-sm text-slate-500">It takes less than a minute.</p>{error && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}<form onSubmit={submit} className="mt-7 space-y-4">{[["fullName", "Full name", UserRound, "Your name"], ["username", "Username", UserRound, "your.handle"], ["email", "Email address", Mail, "you@example.com"], ["password", "Password", Lock, "At least 6 characters"]].map(([name, label, Icon, placeholder]) => <label key={name} className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><div className="input-shell"><Icon size={17} className="text-slate-500" /><input required name={name} type={name === "password" ? "password" : name === "email" ? "email" : "text"} value={form[name]} onChange={update} placeholder={placeholder} /></div></label>)}<button disabled={loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3.5 text-sm font-black text-white shadow-xl shadow-fuchsia-500/20 transition hover:brightness-110 disabled:opacity-50">{loading ? "Creating..." : "Create my account"} <ArrowRight size={17} /></button></form><p className="mt-7 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-fuchsia-300">Sign in</Link></p></div></div></div>;
}
export default Register;
