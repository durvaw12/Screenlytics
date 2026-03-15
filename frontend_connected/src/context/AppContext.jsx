// src/context/AppContext.jsx
// Global state — fully connected to backend API

import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI, logsAPI, plannerAPI } from '../utils/api';

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

  // ✅ Dark mode effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('sl-dark', darkMode);
  }, [darkMode]);

  // ✅ On app load — restore session from localStorage token
  useEffect(() => {
    const token    = localStorage.getItem('sl-token');
    const userData = localStorage.getItem('sl-user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('sl-token');
        localStorage.removeItem('sl-user');
      }
    }
  }, []);

  // ✅ Load logs & tasks when user logs in
  useEffect(() => {
    if (!user) return;
    fetchLogs();
    fetchTasks();
  }, [user]);

  // ✅ Toast helper
  const showToast = useCallback((msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 3200);
  }, []);

  // ✅ Fetch logs from backend
  const fetchLogs = useCallback(async () => {
    try {
      const data = await logsAPI.getAll();
      setLogs(data.logs || []);
      if (data.logs && data.logs.length > 0) {
        const latest = [...data.logs].sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];
        setBurnoutScore(latest.score);
        setBurnoutCat(latest.category);
      }
    } catch (err) {
      console.error('Fetch logs error:', err.message);
    }
  }, []);

  // ✅ Fetch tasks from backend
  const fetchTasks = useCallback(async () => {
    try {
      const data = await plannerAPI.getAll();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks error:', err.message);
    }
  }, []);

  // ✅ LOGIN
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      localStorage.setItem('sl-token', data.token);
      const nameParts = data.user.name.trim().split(' ');
      const userObj = {
        id:        data.user.id,
        firstName: nameParts[0] || '',
        lastName:  nameParts.slice(1).join(' ') || '',
        email:     data.user.email,
      };
      localStorage.setItem('sl-user', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true, firstName: userObj.firstName };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ REGISTER
  const register = useCallback(async ({ firstName, lastName, email, password }) => {
    setLoading(true);
    try {
      await authAPI.register({ firstName, lastName, email, password });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ LOGOUT
  const logout = useCallback(() => {
    localStorage.removeItem('sl-token');
    localStorage.removeItem('sl-user');
    setUser(null);
    setLogs([]);
    setTasks([]);
    setBurnoutScore(0);
    setBurnoutCat('Normal');
  }, []);

  // ✅ UPSERT LOG
  const upsertLog = useCallback(async (entry) => {
    try {
      const data = await logsAPI.upsert(entry);
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.isoDate === entry.isoDate);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...entry, score: data.score, category: data.category };
          return updated;
        }
        return [{ ...entry, score: data.score, category: data.category }, ...prev];
      });
      setBurnoutScore(data.score);
      setBurnoutCat(data.category);
      return { success: true, score: data.score, category: data.category };
    } catch (err) {
      console.error('Upsert log error:', err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // ✅ ADD TASK
  const addTask = useCallback(async (task) => {
    try {
      const data = await plannerAPI.add(task);
      setTasks((prev) => [...prev, data.task]);
      return { success: true };
    } catch (err) {
      console.error('Add task error:', err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // ✅ DELETE TASK
  const deleteTask = useCallback(async (id) => {
    try {
      await plannerAPI.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Delete task error:', err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // ✅ TOGGLE TASK
  const toggleTask = useCallback(async (id) => {
    try {
      const data = await plannerAPI.toggle(id);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: data.done } : t))
      );
      return { success: true };
    } catch (err) {
      console.error('Toggle task error:', err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // ✅ UPDATE USER
  const updateUser = useCallback((patch) => {
    setUser((u) => {
      const updated = { ...u, ...patch };
      localStorage.setItem('sl-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, register, logout, updateUser,
      logs, upsertLog, fetchLogs,
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
