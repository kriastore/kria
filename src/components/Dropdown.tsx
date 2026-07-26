import React from "react";

interface DropdownProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ label, children }) => {
  return (
    <div className="relative inline-block text-left group">
      <div className="inline-flex justify-center w-full cursor-pointer">
        {label}
      </div>
      <div className="origin-top-right absolute right-0 mt-2 w-44 shadow-lg bg-black ring-1 ring-black ring-opacity-5 focus:outline-none z-50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
        <div className="py-1">{children}</div>
      </div>
    </div>
  );
};

export default Dropdown;
