import { Link } from 'react-router-dom';

interface UserLinkProps {
  username: string;
  displayName: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A reusable component that renders a user's display name as a clickable link to their profile
 */
export default function UserLink({ username, displayName, className, style }: UserLinkProps) {
  return (
    <Link
      to={`/profile/${username}`}
      className={className}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        ...style,
      }}
      onClick={e => e.stopPropagation()}>
      {displayName}
    </Link>
  );
}
