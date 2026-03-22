import React from 'react';
import './style.css';

interface InputProps {
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  label: string;
  backgroundColor?: string;
  onInput?: () => void;
}

/**
 * Input component
 */
export const Input = ({ type = 'text', label, backgroundColor, ...props }: InputProps) => {
  return (
    <label className="storybook-input">
      <span>{label}</span>
      <input
        type={type}
        className={['storybook-input', `input-${type}`].join(' ')}
        style={{ backgroundColor }}
        {...props}
      />
    </label>
  );
};
