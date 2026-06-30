import authVideo from "../assets/videos/auth-bg.mp4";

function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={authVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Purple Glow */}
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-[170px]"></div>

      <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[170px]"></div>

      {/* Login Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5">

        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-10 shadow-2xl backdrop-blur-xl">

          {children}

        </div>

      </div>
    </div>
  );
}

export default AuthLayout;