import React from 'react'

const Checkbox = ({ label, type = "checkbox", ...rest }) => {
  return (
    <label className="checkbox-container">
      <input type={type} {...rest} className="checkbox-input" />
      <span className="custom-checkbox" />
      {label && <p>{label}</p>}
    </label>
  )
}

export default Checkbox
