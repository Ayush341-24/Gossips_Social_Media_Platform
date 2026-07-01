import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function Input({
  label,
  icon: Icon,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
}) {
  const [show, setShow] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="mb-5">

      <label className="mb-2 block text-sm text-whit">
        {label}
      </label>

     <div className="flex items-center rounded-xl border border-white/20 bg-white/0 px-4 py-3 backdrop-blur-md">
        {Icon && (
          <Icon
            size={20}
            className="mr-3 text-slate-300"
          />
        )}

        <input
          type={
            isPassword
              ? show
                ? "text"
                : "password"
              : type
          }
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-400"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
          >
            {show ? (
              <EyeOff
                size={20}
                className="text-slate-300"
              />
            ) : (
              <Eye
                size={20}
                className="text-slate-300"
              />
            )}
          </button>
        )}

      </div>

    </div>
  );
}

export default Input;