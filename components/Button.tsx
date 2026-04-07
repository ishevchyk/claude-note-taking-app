'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 hover:opacity-90',
  ghost: 'text-neutral-500 dark:text-neutral-400 hover:text-foreground',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'px-4 py-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-colors disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
