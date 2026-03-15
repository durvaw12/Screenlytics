// src/utils/quotes.js
// Quote data and async fetch helper keyed by burnout band

const QUOTES = {
  normal: [
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
    { text: "The secret of getting ahead is getting started.", author: 'Mark Twain' },
    { text: "You're doing well. Balance is a skill, and you're practising it.", author: 'Screenlytics' },
  ],
  mid: [
    { text: 'Almost everything will work again if you unplug it for a few minutes — including you.', author: 'Anne Lamott' },
    { text: 'Take a rest; a field that has rested gives a bountiful crop.', author: 'Ovid' },
    { text: 'Your attention is your most valuable resource. Guard it.', author: 'Screenlytics' },
  ],
  excess: [
    { text: 'Rest is not idleness. It is necessary for your wellbeing and your future.', author: 'Screenlytics' },
    { text: "You can't pour from an empty cup. Take care of yourself first.", author: 'Unknown' },
    { text: 'Technology is a useful servant but a dangerous master.', author: 'Christian Lous Lange' },
  ],
};

export async function fetchQuoteByScore(score) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const band = score <= 3.5 ? 'normal' : score <= 6.5 ? 'mid' : 'excess';
      const pool = QUOTES[band];
      const q    = pool[Math.floor(Math.random() * pool.length)];
      resolve({ ...q, band });
    }, 350);
  });
}
