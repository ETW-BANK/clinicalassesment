import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-icon">🏥</span>
          <span>Patient Assessment</span>
        </Link>
        
        {/* Mobile Menu Button */}
        <button 
          className="navbar-mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="navbar-menu-icon">{isMenuOpen ? '✕' : '☰'}</span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to="/patients" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <span>👥</span> Patients
              </Link>
              <div className="navbar-user-menu">
                <span className="navbar-user-info">
                  <span>👤</span> {user?.name || user?.email}
                </span>
                <button onClick={handleLogout} className="navbar-logout-btn">
                  <span>🚪</span> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <span>🔐</span> Login
              </Link>
              <Link to="/register" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <span>📝</span> Register
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          background: #0a2342;
          color: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .navbar-brand {
          color: white;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.3s ease;
        }

        .navbar-brand:hover {
          transform: scale(1.05);
        }

        .navbar-brand-icon {
          font-size: 1.8rem;
        }

        .navbar-mobile-menu-btn {
          display: none;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .navbar-mobile-menu-btn:hover {
          background: rgba(255,255,255,0.3);
        }

        .navbar-menu-icon {
          font-size: 1.5rem;
        }

        .navbar-links {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .navbar-link {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .navbar-link:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .navbar-user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-left: 1rem;
          padding-left: 1rem;
          border-left: 1px solid rgba(255,255,255,0.3);
        }

        .navbar-user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .navbar-logout-btn {
          background-color: rgba(231, 76, 60, 0.9);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .navbar-logout-btn:hover {
          background-color: #e74c3c;
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .navbar-mobile-menu-btn {
            display: block;
          }

          .navbar-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--secondary-color);
            flex-direction: column;
            padding: 1rem 2rem;
            gap: 0.75rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }

          .navbar-links.active {
            display: flex;
          }

          .navbar-user-menu {
            flex-direction: column;
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            width: 100%;
            gap: 0.75rem;
          }

          .navbar-user-info {
            width: 100%;
            justify-content: center;
          }

          .navbar-logout-btn {
            width: 100%;
            justify-content: center;
          }

          .navbar-link {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .navbar-container {
            padding: 0.75rem 1rem;
          }

          .navbar-brand {
            font-size: 1.2rem;
          }

          .navbar-brand-icon {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;