// src/components/Navbar.js

import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Log Time',  path: '/log-time'  },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Awareness', path: '/awareness' },
  { label: 'Planner',   path: '/planner'   },
];

export default function Navbar() {
  const { user, logout, darkMode, toggleDark, showToast } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [ddOpen, setDdOpen] = useState(false);

  const initials = user
    ? (user.firstName[0] + (user.lastName[0] || '')).toUpperCase()
    : '';

  function handleLogout() {
    logout();
    setDdOpen(false);
    showToast('Signed out successfully');
    navigate('/');
  }

  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo} onClick={() => navigate('/')}>
        Screenlytics
      </div>

      {/* Nav links — only when logged in */}
      {user && (
        <div className={styles.links}>
          {NAV_LINKS.map((l) => (
            <button
              key={l.path}
              className={`${styles.link} ${location.pathname === l.path ? styles.active : ''}`}
              onClick={() => navigate(l.path)}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Right side */}
      <div className={styles.right}>
        {/* Dark mode toggle */}
        <button
          className={styles.dmBtn}
          onClick={toggleDark}
          title="Toggle dark/light mode"
          aria-label="Toggle dark mode"
        >
          <span className={styles.dmThumb}>{darkMode ? '🌙' : '☀️'}</span>
        </button>

        {user ? (
          /* Avatar + dropdown */
          <div className={styles.avatarWrap}>
            <div
              className={styles.avatar}
              onClick={() => setDdOpen((v) => !v)}
              tabIndex={0}
              onBlur={() => setTimeout(() => setDdOpen(false), 150)}
            >
              {initials}
            </div>
            {ddOpen && (
              <div className={styles.dropdown}>
                <button
                  className={styles.ddItem}
                  onClick={() => { setDdOpen(false); navigate('/profile'); }}
                >
                  👤&nbsp; My Profile
                </button>
                <div className={styles.ddSep} />
                <button
                  className={`${styles.ddItem} ${styles.ddLogout}`}
                  onClick={handleLogout}
                >
                  🚪&nbsp; Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className={styles.ctaBtn} onClick={() => navigate('/auth')}>
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
}
