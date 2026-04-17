// src/pages/Auth.jsx — with name & email validation fixes

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import styles from './Auth.module.css';

// ✅ FIX 1: Name must only contain letters, spaces, hyphens, apostrophes — NO numbers
function isValidName(val) {
  return /^[A-Za-z\s'\-]+$/.test(val.trim());
}

// ✅ FIX 2: Email must have a proper domain with a dot (e.g. .com, .in, .edu)
function isValidEmail(val) {
  // Requires: something @ something . something (min 2 chars after last dot)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
}

export default function Auth() {
  const [tab,     setTab]     = useState('login');
  const [regStep, setRegStep] = useState('form');
  const navigate = useNavigate();
  const { login, register, showToast, loading } = useApp();

  /* Login state */
  const [lEmail, setLEmail] = useState('');
  const [lPw,    setLPw]    = useState('');

  /* Register state */
  const [rFirst, setRFirst] = useState('');
  const [rLast,  setRLast]  = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPw,    setRPw]    = useState('');

  // ✅ Login handler
  async function handleLogin(e) {
    e.preventDefault();
    if (!lEmail.trim()) { showToast('Please enter your email'); return; }
    if (!lPw)           { showToast('Please enter your password'); return; }

    // ✅ FIX 2: Validate email format on login too
    if (!isValidEmail(lEmail)) {
      showToast('Please enter a valid email address (e.g. you@gmail.com)');
      return;
    }

    const result = await login({ email: lEmail.trim(), password: lPw });

    if (result.success) {
      showToast(`Welcome, ${result.firstName}! 🌟`);
      navigate('/dashboard');
    } else {
      showToast(result.message || 'Login failed');
    }
  }

  // ✅ Register handler — all validations applied
  async function handleRegister(e) {
    e.preventDefault();

    if (!rFirst.trim()) {
      showToast('Please enter your first name');
      return;
    }

    // ✅ FIX 1: Block numbers in first name
    if (!isValidName(rFirst)) {
      showToast('First name must contain only letters — no numbers allowed');
      return;
    }

    // ✅ FIX 1: Block numbers in last name (only if provided)
    if (rLast.trim() && !isValidName(rLast)) {
      showToast('Last name must contain only letters — no numbers allowed');
      return;
    }

    if (!rEmail.trim()) {
      showToast('Please enter your email');
      return;
    }

    // ✅ FIX 2: Proper email format check — must have .com / .in / .edu etc.
    if (!isValidEmail(rEmail)) {
      showToast('Please enter a valid email address (e.g. you@gmail.com)');
      return;
    }

    if (rPw.length < 8) {
      showToast('Password must be at least 8 characters');
      return;
    }

    const result = await register({
      firstName: rFirst.trim(),
      lastName:  rLast.trim(),
      email:     rEmail.trim(),
      password:  rPw,
    });

    if (result.success) {
      setRegStep('success');
      setTimeout(() => {
        setRFirst(''); setRLast(''); setRPw('');
        setLEmail(rEmail);
        setREmail('');
        setRegStep('form');
        setTab('login');
        showToast('Account created! Please sign in ✅');
      }, 2400);
    } else {
      showToast(result.message || 'Registration failed');
    }
  }

  // ✅ FIX 1: Block numeric key presses in name fields live
  function handleNameInput(setter) {
    return (e) => {
      const val = e.target.value;
      // Allow only letters, spaces, hyphens, apostrophes
      if (/[0-9]/.test(val)) {
        showToast('Name cannot contain numbers');
        return;
      }
      setter(val);
    };
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logo} onClick={() => navigate('/')}>Screenlytics</span>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login'    ? styles.active : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {/* ── Login ── */}
        {tab === 'login' && (
          <form className={styles.form} onSubmit={handleLogin}>
            <h2>Welcome back</h2>
            <p className={styles.sub}>Sign in to your Screenlytics account</p>
            <div className="form-group">
              <label>Email</label>
              <input
                type="text"
                placeholder="you@university.edu"
                value={lEmail}
                onChange={e => setLEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={lPw} onChange={e => setLPw(e.target.value)} />
            </div>
            <button type="submit" className="btn-full" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <p className={styles.switchLine}>
              No account?{' '}
              <span className={styles.switchLink} onClick={() => setTab('register')}>Register here</span>
            </p>
          </form>
        )}

        {/* ── Register ── */}
        {tab === 'register' && (
          regStep === 'form' ? (
            <form className={styles.form} onSubmit={handleRegister}>
              <h2>Create account</h2>
              <p className={styles.sub}>Join Screenlytics and take back your focus</p>
              <div className={styles.regFields}>
                <div className={styles.regRow}>
                  <div className="form-group">
                    <label>First Name</label>
                    {/* ✅ FIX 1: letters only, numbers blocked live */}
                    <input
                      type="text"
                      placeholder="Alex"
                      value={rFirst}
                      onChange={handleNameInput(setRFirst)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    {/* ✅ FIX 1: letters only, numbers blocked live */}
                    <input
                      type="text"
                      placeholder="Johnson"
                      value={rLast}
                      onChange={handleNameInput(setRLast)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  {/* ✅ FIX 2: use type="text" so we control validation ourselves */}
                  <input
                    type="text"
                    placeholder="you@university.edu"
                    value={rEmail}
                    onChange={e => setREmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Password <span className={styles.hint}>(min 8 characters)</span></label>
                  <input type="password" placeholder="Create a strong password" value={rPw} onChange={e => setRPw(e.target.value)} />
                </div>
                <button type="submit" className="btn-full" style={{ marginTop: 4 }} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Account →'}
                </button>
              </div>
              <p className={styles.switchLine}>
                Already registered?{' '}
                <span className={styles.switchLink} onClick={() => setTab('login')}>Sign in</span>
              </p>
            </form>
          ) : (
            <div className={styles.success}>
              <div className={styles.successCircle}>✅</div>
              <h3>Account Created!</h3>
              <p>Your account is ready.<br />Redirecting to sign in…</p>
              <div className="spinner" />
            </div>
          )
        )}
      </div>
    </div>
  );
}
