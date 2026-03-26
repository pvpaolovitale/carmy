import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-surface-2 border border-border rounded-xl p-4 ${
        hover ? 'transition-transform hover:-translate-y-0.5 hover:border-accent/40' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
