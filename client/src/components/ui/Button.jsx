function Button({
  children,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full rounded-xl py-3 font-semibold text-white transition duration-300 ${
        disabled
          ? "cursor-not-allowed bg-gray-500 opacity-70"
          : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:scale-105"
      }`}
    >
      {children}
    </button>
  );
}

export default Button;