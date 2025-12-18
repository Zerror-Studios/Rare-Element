import React, { forwardRef } from "react";

const Checkbox = forwardRef(
  ({ label, type = "checkbox", className = "", ...rest }, ref) => {
    return (
      <label className="checkbox-container">
        <input
          ref={ref}            
          type={type}
          {...rest}
          className={`checkbox-input ${className}`}
        />

        <span className="custom-checkbox" />

        {label && <p>{label}</p>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
