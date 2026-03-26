interface BadgeProps {
  children: React.ReactNode;
  color?: 'amber' | 'green' | 'blue' | 'gray' | 'red';
}

const colors = {
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}
