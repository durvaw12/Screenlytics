// backend/controllers/notificationController.js
// Handles Daily Reminders, Burnout Alerts, and Weekly Reports

const db        = require('../config/db');
const nodemailer = require('nodemailer');

// ─── Email transporter (configure in .env) ────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,   // your sending Gmail address
      pass: process.env.EMAIL_PASS,   // Gmail App Password
    },
  });
}

// ─── Helper: build a simple HTML email ───────────────────────────────────────
function buildEmail(subject, bodyHtml) {
  return {
    from: `"Screenlytics" <${process.env.EMAIL_USER}>`,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fdf6ec;border-radius:12px;">
        <h2 style="color:#e07b39;">📱 Screenlytics</h2>
        ${bodyHtml}
        <hr style="margin-top:32px;border:none;border-top:1px solid #ddd"/>
        <p style="font-size:12px;color:#999;">You are receiving this because you are registered on Screenlytics.</p>
      </div>
    `,
  };
}

// ─── 1. DAILY REMINDER ────────────────────────────────────────────────────────
exports.sendDailyReminders = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const [users] = await db.query(
      `SELECT u.id, u.email, u.name
       FROM users u
       LEFT JOIN screen_logs sl
         ON sl.user_id = u.id AND DATE(sl.log_date) = ?
       WHERE sl.id IS NULL`,
      [today]
    );

    if (users.length === 0) {
      console.log('[DailyReminder] All users have logged today — no emails sent.');
      return;
    }

    const transporter = createTransporter();

    for (const user of users) {
      const mail = buildEmail(
        '⏰ Don\'t forget to log your screen time today!',
        `<p>Hi <strong>${user.name}</strong>,</p>
         <p>You haven't logged your screen time yet today. Keeping a consistent record helps you spot patterns and protect your wellbeing.</p>
         <a href="${process.env.CLIENT_URL}/log" 
            style="display:inline-block;margin-top:16px;padding:12px 24px;background:#e07b39;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
           Log My Screen Time →
         </a>`
      );

      await transporter.sendMail({ ...mail, to: user.email });
      console.log(`[DailyReminder] Sent to ${user.email}`);
    }

  } catch (err) {
    console.error('[DailyReminder] Error:', err.message);
  }
};

// ─── 2. BURNOUT ALERT ─────────────────────────────────────────────────────────
exports.sendBurnoutAlert = async (userId, score) => {
  try {
    const [[user]] = await db.query(
      'SELECT email, name FROM users WHERE id = ?',
      [userId]
    );
    if (!user) return;

    const transporter = createTransporter();

    const mail = buildEmail(
      `🚨 Burnout Alert — Your score is ${score}/10`,
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your latest burnout score is <strong style="color:#c0392b;">${score}/10</strong>, which is in the <strong>high-risk zone</strong>.</p>
       <p>Here are some things you can do right now:</p>
       <ul>
         <li>📴 Put your phone in another room for 1 hour</li>
         <li>🚶 Take a 10-minute walk without any device</li>
         <li>😴 Stop all screens at least 90 minutes before bed</li>
       </ul>
       <p>Check your Awareness page for personalised strategies.</p>
       <a href="${process.env.CLIENT_URL}/awareness" 
          style="display:inline-block;margin-top:16px;padding:12px 24px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
         View Strategies →
       </a>`
    );

    await transporter.sendMail({ ...mail, to: user.email });
    console.log(`[BurnoutAlert] Sent to ${user.email} (score ${score})`);

  } catch (err) {
    console.error('[BurnoutAlert] Error:', err.message);
  }
};

// ─── 3. WEEKLY REPORT ─────────────────────────────────────────────────────────
exports.sendWeeklyReports = async () => {
  try {
    const [users] = await db.query('SELECT id, email, name FROM users');

    if (users.length === 0) return;

    const transporter = createTransporter();

    for (const user of users) {
      const [logs] = await db.query(
        `SELECT 
           DATE_FORMAT(log_date, '%Y-%m-%d') AS isoDate,
           CAST(total_mins AS UNSIGNED)       AS totalMins,
           CAST(score AS DECIMAL(4,2))        AS score,
           category
         FROM screen_logs
         WHERE user_id = ?
           AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         ORDER BY log_date ASC`,
        [user.id]
      );

      if (logs.length === 0) continue;

      const totalMins = logs.reduce((s, l) => s + Number(l.totalMins), 0);
      const avgMins   = Math.round(totalMins / logs.length);
      const avgScore  = (logs.reduce((s, l) => s + parseFloat(l.score), 0) / logs.length).toFixed(1);
      const maxDay    = logs.reduce((a, b) => Number(a.totalMins) > Number(b.totalMins) ? a : b);
      const minDay    = logs.reduce((a, b) => Number(a.totalMins) < Number(b.totalMins) ? a : b);

      const rows = logs.map(l => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${l.isoDate}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${Math.round(Number(l.totalMins) / 60)}h ${Number(l.totalMins) % 60}m</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${l.score}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:${l.category==='Excess'?'#c0392b':l.category==='Mid'?'#e07b39':'#27ae60'};">${l.category}</td>
        </tr>`).join('');

      const mail = buildEmail(
        '📊 Your Screenlytics Weekly Report',
        `<p>Hi <strong>${user.name}</strong>, here is your screen-time summary for the past week.</p>
         <table style="width:100%;border-collapse:collapse;margin-top:16px;">
           <thead>
             <tr style="background:#e07b39;color:#fff;">
               <th style="padding:10px;text-align:left;">Date</th>
               <th style="padding:10px;text-align:left;">Total Time</th>
               <th style="padding:10px;text-align:left;">Score</th>
               <th style="padding:10px;text-align:left;">Category</th>
             </tr>
           </thead>
           <tbody>${rows}</tbody>
         </table>
         <div style="margin-top:24px;background:#fff;border-radius:8px;padding:16px;">
           <h3 style="margin-top:0;color:#333;">📈 Week Summary</h3>
           <p>📅 Days logged: <strong>${logs.length}</strong></p>
           <p>⏱ Average daily screen time: <strong>${Math.floor(avgMins/60)}h ${avgMins%60}m</strong></p>
           <p>🔥 Average burnout score: <strong>${avgScore}/10</strong></p>
           <p>📈 Highest day: <strong>${maxDay.isoDate}</strong> (${Math.round(Number(maxDay.totalMins)/60)}h ${Number(maxDay.totalMins)%60}m)</p>
           <p>📉 Lowest day: <strong>${minDay.isoDate}</strong> (${Math.round(Number(minDay.totalMins)/60)}h ${Number(minDay.totalMins)%60}m)</p>
         </div>
         <a href="${process.env.CLIENT_URL}/analytics" 
            style="display:inline-block;margin-top:20px;padding:12px 24px;background:#e07b39;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
           View Full Analytics →
         </a>`
      );

      await transporter.sendMail({ ...mail, to: user.email });
      console.log(`[WeeklyReport] Sent to ${user.email}`);
}

  } catch (err) {
    console.error('[WeeklyReport] Error:', err.message);
  }
};