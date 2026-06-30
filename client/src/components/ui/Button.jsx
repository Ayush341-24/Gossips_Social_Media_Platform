function Button({ children, type = "button" }) {
  return (
    <button
      type={type}
      className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-semibold text-white transition duration-300 hover:scale-105"
    >
      {children}
    </button>
  );
}

export default Button;