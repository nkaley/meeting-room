import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({ children, adminOnly }: Props) {
  const { me, loading } = useAuth();

  if (loading) {
    return <div className="page">Загрузка...</div>;
  }

  if (!me) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && me.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
