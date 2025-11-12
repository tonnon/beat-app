import { Navigate } from 'react-router-dom';

export default function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}
