// src/context/AppContext.jsx
// Global state: user, logs, tasks, burnout score, dark mode

import { createContext, useState, useEffect, useCallback } from 'react';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [logs, setLogs]                 = useState([]);
  const [tasks, setTasks]               = useState([]);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [burnoutCat, setBurnoutCat]     = useState('Normal');
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem('sl-dark') === 'true');
  const [toast, setToast]               = useState({ visible: false, msg: '' });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sl-dark', darkMode);
  }, [darkMode]);

  const showToast = useCallback((msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 3200);
  }, []);

  const login  = useCallback((userData) => setUser(userData), []);

  const logout = useCallback(() => {
    setUser(null);
    setLogs([]);
    setTasks([]);
    setBurnoutScore(0);
    setBurnoutCat('Normal');
  }, []);

  const upsertLog = useCallback((entry) => {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.isoDate === entry.isoDate);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = entry;
        return updated;
      }
      return [entry, ...prev];
    });
    setBurnoutScore(entry.score);
    setBurnoutCat(entry.category);
  }, []);

  const addTask    = useCallback((task) => setTasks((p) => [...p, task]), []);
  const deleteTask = useCallback((id)   => setTasks((p) => p.filter((t) => t.id !== id)), []);
  const toggleTask = useCallback((id)   => setTasks((p) => p.map((t) => t.id === id ? { ...t, done: !t.done } : t)), []);
  const updateUser = useCallback((patch) => setUser((u) => ({ ...u, ...patch })), []);

  return (
    <AppContext.Provider value={{
      user, login, logout, updateUser,
      logs, upsertLog,
      tasks, addTask, deleteTask, toggleTask,
      burnoutScore, burnoutCat,
      darkMode, toggleDark: () => setDarkMode((d) => !d),
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}
