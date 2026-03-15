// src/context/AppContext.jsx

import { createContext, useState, useEffect, useCallback } from 'react';
import { logsAPI, tasksAPI } from '../utils/api';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [logs,         setLogs]         = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [burnoutCat,   setBurnoutCat]   = useState('Normal');
  const [darkMode,     setDarkMode]     = useState(() => localStorage.getItem('sl-dark') === 'true');
  const [toast,        setToast]        = useState({ visible: false, msg: '' });
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sl-dark', darkMode);
  }, [darkMode]);

  // Re-hydrate session on page refresh
  useEffect(() => {
    const stored = localStorage.getItem('sl-user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('sl-user'); }
    }
  }, []);

  // Fetch logs & tasks whenever user logs in
  useEffect(() => {
    if (!user) { setLogs([]); setTasks([]); return; }

    async function fetchData() {
      setLoading(true);
      try {
        const [logsRes, tasksRes] = await Promise.all([
          logsAPI.getLogs(),
          tasksAPI.getTasks(),
        ]);

        const normLogs = logsRes.data.map(normaliseLog);
        setLogs(normLogs);

        if (normLogs.length > 0) {
          setBurnoutScore(normLogs[0].score);
          setBurnoutCat(normLogs[0].category);
        }

        setTasks(tasksRes.data.map(normaliseTask));
      } catch (err) {
        console.error('Failed to load data:', err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  function isoToDMY(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d} / ${m} / ${y}`;
  }

  function normaliseLog(entry) {
    return {
      isoDate:     entry.logDate || entry.isoDate,
      displayDate: entry.logDate ? isoToDMY(entry.logDate) : entry.displayDate,
      totalMins:   entry.totalMins,
      study:       entry.studyMins  ?? entry.study  ?? 0,
      social:      entry.socialMins ?? entry.social ?? 0,
      ent:         entry.entMins    ?? entry.ent    ?? 0,
      other:       entry.otherMins  ?? entry.other  ?? 0,
      score:       parseFloat(entry.score) || 0,
      category:    entry.category,
    };
  }

  function normaliseTask(t) {
    return {
      id:          t.id,
      title:       t.title,
      timeSlot:    t.timeSlot || null,
      isDone:      t.isDone   ?? false,
      type:        t.type     || 'study',
      isoDate:     t.isoDate  || null,
      displayDate: t.displayDate || null,
      time:        t.time     || t.timeSlot || '09:00',
      duration:    t.duration || 60,
    };
  }

  const showToast = useCallback((msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 3200);
  }, []);

  const login = useCallback((userData, token) => {
    setUser(userData);
    localStorage.setItem('sl-user',  JSON.stringify(userData));
    if (token) localStorage.setItem('sl-token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setLogs([]);
    setTasks([]);
    setBurnoutScore(0);
    setBurnoutCat('Normal');
    localStorage.removeItem('sl-user');
    localStorage.removeItem('sl-token');
  }, []);

  const upsertLog = useCallback((entry) => {
    const norm = normaliseLog(entry);
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.isoDate === norm.isoDate);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = norm;
        return updated;
      }
      return [norm, ...prev];
    });
    setBurnoutScore(norm.score);
    setBurnoutCat(norm.category);
  }, []);

  const addTask    = useCallback((task) => setTasks((p) => [...p, normaliseTask(task)]), []);
  const deleteTask = useCallback((id)   => setTasks((p) => p.filter((t) => t.id !== id)), []);
  const toggleTask = useCallback((id)   => setTasks((p) => p.map((t) => t.id === id ? { ...t, isDone: !t.isDone } : t)), []);
  const updateUser = useCallback((patch) => {
    setUser((u) => {
      const updated = { ...u, ...patch };
      localStorage.setItem('sl-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout, updateUser,
      logs, upsertLog,
      tasks, addTask, deleteTask, toggleTask,
      burnoutScore, burnoutCat,
      darkMode, toggleDark: () => setDarkMode((d) => !d),
      toast, showToast,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}