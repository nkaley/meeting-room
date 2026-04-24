import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatUserName } from '../utils';

export function Layout({ children }: { children: ReactNode }) {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="page">
      <header className="header">
        <div className="header__brand">
          <Link to="/" className="header__logo">
            Meeting Rooms
          </Link>
          <nav className="header__nav">
            <Link
              to="/"
              className={!isAdminRoute ? 'header__link header__link--active' : 'header__link'}
            >
              Календарь
            </Link>
            {me?.role === 'ADMIN' && (
              <Link
                to="/admin/offices-rooms"
                className={
                  isAdminRoute ? 'header__link header__link--active' : 'header__link'
                }
              >
                Офисы и переговорки
              </Link>
            )}
          </nav>
        </div>
        <div className="header__user">
          {me && (
            <span className="header__email" title={me.email}>
              {formatUserName(me)}
            </span>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
