export function getProfileInitial(
  displayName?: string | null,
  email?: string | null,
): string {
  const name = displayName?.trim();
  if (name) {
    return name.split(/\s+/)[0]!.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return '?';
}

interface ProfileAvatarProps {
  displayName?: string | null;
  email?: string | null;
  size?: 'nav' | 'profile';
}

export function ProfileAvatar({
  displayName,
  email,
  size = 'nav',
}: ProfileAvatarProps) {
  const initial = getProfileInitial(displayName, email);

  return (
    <span className={`profile-avatar profile-avatar--${size}`} aria-hidden>
      {initial}
    </span>
  );
}
