/*
  Project: SubTracker Pro
  Author: N H Padma Priya
  Year: 2025
*/
// Utilities to build exportable/printable reports
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildReportHtml(subs, title = 'Subscriptions Report') {
  const generatedAt = new Date().toLocaleString();
  const monthlyTotal = subs.reduce((acc, s) => acc + (s.frequency === 'yearly' ? Number(s.price || 0) / 12 : Number(s.price || 0)), 0);
  const rows = subs
    .map(
      (s) => `\n      <tr>\n        <td>${escapeHtml(s.name || '')}</td>\n        <td>${escapeHtml(s.company || '')}</td>\n        <td>${escapeHtml(s.currency || '')} ${Number(s.price || 0).toFixed(2)}</td>\n        <td>${escapeHtml(s.frequency || '')}</td>\n        <td>${escapeHtml(s.startDate || '')}</td>\n        <td>${escapeHtml(s.renewalDate || '')}</td>\n        <td>${escapeHtml(s.category || '')}</td>\n        <td>${escapeHtml((s.notes || '').toString())}</td>\n      </tr>`
    )
    .join('');
  return `<!doctype html>\n<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>\n<style>\n  body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }\n  h1 { margin-bottom: 4px; font-size: 22px; }\n  .meta { margin-bottom: 16px; color: #374151; font-size: 12px; }\n  table { width: 100%; border-collapse: collapse; }\n  th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; vertical-align: top; }\n  th { background: #f3f4f6; text-align: left; }\n</style></head><body>\n  <h1>${escapeHtml(title)}</h1>\n  <div class="meta">Generated at: ${escapeHtml(generatedAt)} • Total subscriptions: ${subs.length} • Monthly cost: ₹${monthlyTotal.toFixed(2)}</div>\n  <table>\n    <thead>\n      <tr>\n        <th>Subscription</th>\n        <th>Company</th>\n        <th>Price</th>\n        <th>Frequency</th>\n        <th>Start Date</th>\n        <th>Renewal Date</th>\n        <th>Category</th>\n        <th>Notes</th>\n      </tr>\n    </thead>\n    <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:#6b7280;padding:16px;">No subscriptions available.</td></tr>'}</tbody>\n  </table>\n</body></html>`;
}
