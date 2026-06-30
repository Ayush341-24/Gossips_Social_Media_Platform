import { MessageCircleMore } from "lucide-react";

function AuthBrand() {
  return (
    <div className="flex flex-col">

      {/* Logo */}

      <div className="mb-8 flex items-center gap-4">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-xl">

          <MessageCircleMore
            size={34}
            className="text-white"
          />

        </div>

        <div>

          <h1 className="text-5xl font-extrabold tracking-wide text-white">
            Gossips
          </h1>

          <p className="mt-1 text-slate-300">
            Connect • Share • Inspire
          </p>

        </div>

      </div>

      {/* Hero Text */}

      <div className="space-y-4">

        <h2 className="text-6xl font-bold leading-tight text-white">

          Share
          <span className="text-violet-400"> Moments.</span>

        </h2>

        <h2 className="text-6xl font-bold leading-tight text-white">

          Stay
          <span className="text-fuchsia-400"> Connected.</span>

        </h2>

        <p className="mt-8 max-w-lg text-lg leading-8 text-slate-300">

          Welcome to Gossips — a modern social platform where
          conversations begin, memories are shared, and
          communities grow together.

        </p>

      </div>

    </div>
  );
}

export default AuthBrand;