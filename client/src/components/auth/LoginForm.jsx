import { Mail, Lock } from "lucide-react";
import { useState } from "react";

import AuthHeader from "./AuthHeader";
import Input from "../ui/Input";
import Button from "../ui/Button";

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit}>

      <AuthHeader />

      <h2 className="mb-2 text-4xl font-bold text-white">
        Welcome Back
      </h2>

      <p className="mb-8 text-slate-300">
        Sign in to continue.
      </p>

      <Input
        label="Email"
        icon={Mail}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
      />

      <Input
        label="Password"
        icon={Lock}
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
      />

      <div className="mb-6 text-right">

        <button
          type="button"
          className="text-sm text-violet-300 hover:text-violet-200"
        >
          Forgot Password?
        </button>

      </div>

      <Button type="submit">

        Login

      </Button>

      <div className="my-6 flex items-center">

        <div className="h-px flex-1 bg-white/20"></div>

        <span className="mx-4 text-white">
          OR
        </span>

        <div className="h-px flex-1 bg-white/20"></div>

      </div>

      <button
        type="button"
        className="w-full rounded-xl border border-white/20 bg-white/5 py-3 text-white backdrop-blur-lg transition hover:bg-white/10"
      >
        Continue with Google
      </button>

      <p className="mt-8 text-center text-slate-300">

        Don't have an account?

        <span className="ml-2 cursor-pointer font-semibold text-violet-300 hover:text-violet-200">

          Sign Up

        </span>

      </p>

    </form>
  );
}

export default LoginForm;