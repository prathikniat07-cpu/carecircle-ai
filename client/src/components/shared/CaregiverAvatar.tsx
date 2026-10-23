interface CaregiverAvatarProps {
  initials?: string | null;
  name?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function CaregiverAvatar({
  initials,
  name,
  color = '#23483D',
  size = 'md',
}: CaregiverAvatarProps) {
  const displayInitials = initials || (name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?');

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
  }[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-medium shrink-0 select-none shadow-xs ${sizeClasses}`}
      style={{ backgroundColor: color || '#23483D' }}
      title={name || undefined}
      aria-label={name ? `Avatar for ${name}` : 'Caregiver avatar'}
    >
      {displayInitials}
    </div>
  );
}
