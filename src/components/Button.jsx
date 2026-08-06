import React from 'react';

const Button = ({ children, isLoading, type = 'button', className = '', ...props }) => {
  return (
    <button
      type={type}
      className={`btn btn-primary ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <span className="spinner"></span>}
      {children}
    </button>
  );
};

export default Button;
