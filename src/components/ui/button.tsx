import React from 'react';
import classNames from 'classnames';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'default', 
  className, 
  children, 
  ...props 
}: ButtonProps) => {
  return (
    <button
      className={classNames(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' && 'bg-brand-green text-white hover:bg-green-600',
        variant === 'outline' && 'border border-brand-green text-brand-green hover:bg-brand-green hover:text-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
