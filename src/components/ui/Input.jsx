import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      type = "text",
      label = "",
      placeholder = "",
      className = "",
      error,
      isRequired = false,
      ...rest
    },
    ref
  ) => {
    return (
      <div className="w-full text-base">
        {label && (
          <p className="text-sm">
            {label}
            {isRequired && <span> * </span>}
          </p>
        )}

        <input
          ref={ref}                    // ✅ forwarded here
          type={type}
          placeholder={placeholder}
          className={`checkOut_input ${className}`}
          {...rest}
        />

        {error && (
          <p className="input_error_msg text-xs">
            {error?.message || ""}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
