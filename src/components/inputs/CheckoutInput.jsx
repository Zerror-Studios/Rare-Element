import React from "react";

const CheckoutInput = ({
  type = "text",
  placeholder = "",
  className = "",
  name = "",
  value,
  onChange,
  ...rest
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`checkOut_input ${className}`}
      name={name}
      value={value}
      onChange={onChange}
      {...rest}
    />
  );
};

export default CheckoutInput;
