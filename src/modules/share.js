/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Share modal interactions (email, shareable link, print)
import { buildReportHtml } from '../utils/report.js';

function getSubscriptionsSafe() {
  try {
    if (Array.isArray(window.subscriptions) && window.subscriptions.length) {
      return window.subscriptions;
    }
  } catch (_) {}
  try {
    const email = window.currentUser && window.currentUser.email;
    if (email) {
      const raw = localStorage.getItem(`subtracker_subscriptions_${email}`);
      return raw ? JSON.parse(raw) : [];
    }
  } catch (_) {}
  return [];
}

export function setupShare() {
  // Email
  const modal = document.getElementById('shareModal');
  if (!modal) return;

  // Email
  modal.querySelector('.share-option:nth-child(1)')?.addEventListener('click', () => {
    const subs = getSubscriptionsSafe();
    const subject = 'SubTracker Pro: Subscription Report';
    let monthly = 0;
    subs.forEach((s) => (monthly += s.frequency === 'yearly' ? Number(s.price || 0) / 12 : Number(s.price || 0)));
    const lines = [
      'Here is my subscription report:',
      '',
      `Total subscriptions: ${subs.length}`,
      `Estimated monthly cost: ₹${monthly.toFixed(2)}`,
      '',
      'Details:',
      ...subs.slice(0, 50).map((s) => `- ${s.name || 'Unnamed'} • ${s.currency || ''}${Number(s.price || 0).toFixed(2)} / ${s.frequency || ''} • Renewal: ${s.renewalDate || ''} • Category: ${s.category || ''}`),
      subs.length > 50 ? `... and ${subs.length - 50} more.` : '',
    ];
    const body = lines.join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  // Shareable Link
  modal.querySelector('.share-option:nth-child(2)')?.addEventListener('click', () => {
    const payload = {
      v: 1,
      generatedAt: new Date().toISOString(),
      data: { subscriptions: getSubscriptionsSafe() },
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const shareLink = `${window.location.origin + window.location.pathname}#share=${encoded}`;
    const input = document.getElementById('shareLinkInput');
    const container = document.getElementById('shareLinkContainer');
    if (input && container) {
      input.value = shareLink;
      container.style.display = 'block';
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(shareLink).then(() => {}).catch(() => {});
      }
    }
  });

  // Print
  modal.querySelector('.share-option:nth-child(3)')?.addEventListener('click', () => {
    const html = buildReportHtml(getSubscriptionsSafe(), 'Subscriptions Report (Printable)');
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      try {
        win.print();
      } catch (_) {}
    }, 300);
  });

  // Link copy button
  modal.querySelector('button.btn-secondary')?.addEventListener('click', () => {
    const input = document.getElementById('shareLinkInput');
    if (!input) return;
    const text = input.value;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        input.select();
        document.execCommand('copy');
      });
    } else {
      input.select();
      document.execCommand('copy');
    }
  });

  // Detect share link on load
  try {
    const hash = window.location.hash || '';
    if (hash.startsWith('#share=')) {
      const encoded = hash.slice(7);
      const json = decodeURIComponent(escape(atob(encoded)));
      const payload = JSON.parse(json);
      if (payload?.data?.subscriptions) {
        const ok = confirm('A shared subscription report was detected in the link. Load it (in-memory only)?');
        if (ok) {
          window.subscriptions = payload.data.subscriptions;
          if (window.updateDashboard) window.updateDashboard();
        }
      }
    }
  } catch (_) {}
}
