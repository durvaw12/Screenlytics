// src/pages/Planner.jsx

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { todayDMY, dmyToISO } from '../utils/date';
import { tasksAPI } from '../utils/api';
import styles from './Planner.module.css';

const TYPE_META = {
  study:    { label: '📚 Study',    color: '#a78bfa' },
  exercise: { label: '🏃 Exercise', color: '#e8a44a' },
  break:    { label: '☀️ Break',    color: '#7a9e6e' },
  nophone:  { label: '📵 No Phone', color: '#c8622a' },
};

function fmtDateInput(val) {
  let v = val.replace(/\D/g, '').slice(0, 8);
  let o = '';
  if (v.length > 0) o += v.slice(0, 2);
  if (v.length > 2) o += ' / ' + v.slice(2, 4);
  if (v.length > 4) o += ' / ' + v.slice(4, 8);
  return o;
}

function timeToMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minsToTime(m) {
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export default function Planner() {
  const { tasks, addTask, deleteTask, toggleTask, showToast } = useApp();

  const [selType,  setSelType]  = useState('study');
  const [title,    setTitle]    = useState('');
  const [date,     setDate]     = useState(todayDMY());
  const [time,     setTime]     = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [busy,     setBusy]     = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) { showToast('Please enter a task title'); return; }
    const isoDate = dmyToISO(date);
    if (!isoDate)      { showToast('Please enter a valid date (DD / MM / YYYY)'); return; }

    // Build a time_slot string like "09:00 AM" for the backend
    const [hh, mm] = time.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12  = hh % 12 || 12;
    const timeSlot = `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;

    setBusy(true);
    try {
      const res = await tasksAPI.createTask({ title: title.trim(), timeSlot });
      // Merge backend id with frontend-only display fields
      addTask({
        ...res.data,
        type:        selType,
        isoDate,
        displayDate: date,
        time,
        duration:    +duration,
      });
      setTitle('');
      showToast('Task added to schedule!');
    } catch (err) {
      showToast(err.message || 'Failed to add task');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id) {
    toggleTask(id); // optimistic
    try {
      await tasksAPI.toggleTask(id);
    } catch (err) {
      toggleTask(id); // revert on failure
      showToast(err.message || 'Failed to update task');
    }
  }

  async function handleDelete(id) {
    deleteTask(id); // optimistic
    try {
      await tasksAPI.deleteTask(id);
      showToast('Task removed');
    } catch (err) {
      showToast(err.message || 'Failed to delete task');
    }
  }

  // Group tasks by date (sorted)
  const grouped = {};
  [...tasks]
    .sort((a, b) => {
      const da = a.isoDate || '';
      const db = b.isoDate || '';
      if (da !== db) return da.localeCompare(db);
      return (a.time || '').localeCompare(b.time || '');
    })
    .forEach(t => {
      const key = t.isoDate || 'unscheduled';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });

  return (
    <div className={styles.page}>
      <div className="page-inner fade-in">
        <div className="page-header">
          <h1>Schedule Planner</h1>
          <p>Add tasks and see them reflected in your schedule instantly.</p>
        </div>

        <div className={styles.layout}>
          {/* Add task form */}
          <form className={styles.addCard} onSubmit={handleAdd}>
            <h2 className={styles.cardTitle}>+ Add Task</h2>

            {/* Type selector */}
            <div className={styles.typeGrid}>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.typeBtn} ${selType === key ? styles.typeSel : ''}`}
                  onClick={() => setSelType(key)}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div className={styles.fields}>
              <div className="form-group">
                <label>Task Title</label>
                <input type="text" placeholder="e.g. Physics revision" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Date (DD / MM / YYYY)</label>
                <input
                  type="text"
                  placeholder="DD / MM / YYYY"
                  value={date}
                  maxLength={14}
                  inputMode="numeric"
                  onChange={e => setDate(fmtDateInput(e.target.value))}
                />
              </div>

              <div className={styles.timeRow}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className={styles.timeInput} />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} className={styles.selectInput}>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hrs</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Adding…' : 'Add to Schedule'}
              </button>
            </div>
          </form>

          {/* Schedule view */}
          <div className={styles.scheduleCard}>
            <h2 className={styles.cardTitle}>📅 Your Schedule</h2>

            {tasks.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <p className={styles.emptyTitle}>No tasks yet</p>
                <p className={styles.emptyHint}>Add a task on the left to see it here.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([iso, dayTasks]) => {
                let dateStr = iso;
                if (iso !== 'unscheduled') {
                  const [y, m, d] = iso.split('-');
                  dateStr = new Date(+y, +m - 1, +d).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  });
                }
                return (
                  <div key={iso} className={styles.dayGroup}>
                    <div className={styles.dayLabel}>{dateStr}</div>
                    {dayTasks.map(t => {
                      const meta    = TYPE_META[t.type] || TYPE_META.study;
                      const endTime = t.time ? minsToTime(timeToMins(t.time) + (+t.duration || 60)) : '';
                      return (
                        <div key={t.id} className={`${styles.taskItem} ${t.isDone ? styles.done : ''}`}>
                          <span className={styles.typeDot} style={{ background: meta.color }} />
                          <div className={styles.taskInfo}>
                            <div className={styles.taskTitle}>{t.title}</div>
                            <div className={styles.taskMeta}>
                              {meta.label}
                              {t.time ? ` · ${t.time}${endTime ? ` – ${endTime}` : ''} · ${t.duration} min` : ''}
                            </div>
                          </div>
                          <button className={styles.btnDone}  onClick={() => handleToggle(t.id)}>
                            {t.isDone ? '↩ Undo' : '✓ Done'}
                          </button>
                          <button className={styles.btnDelete} onClick={() => handleDelete(t.id)}>
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
