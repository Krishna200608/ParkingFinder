import React from "react";

const FormContainer = ({ children }) => {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      {children}
    </div>
  );
};

export default FormContainer;
