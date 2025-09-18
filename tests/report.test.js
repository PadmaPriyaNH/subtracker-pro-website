import { describe, it, expect } from 'vitest';
import { buildReportHtml } from '../src/utils/report.js';

describe('buildReportHtml', () => {
  it('returns valid HTML with table headers', () => {
    const html = buildReportHtml([]);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Subscription</th>');
  });

  it('renders rows for provided subscriptions', () => {
    const html = buildReportHtml([
      {
        name: 'Netflix',
        company: 'Netflix Inc.',
        price: 499,
        currency: '₹',
        frequency: 'monthly',
        startDate: '2025-01-01',
        renewalDate: '2025-02-01',
        category: 'Entertainment',
        notes: 'HD Plan',
      },
    ]);
    expect(html).toContain('Netflix');
    expect(html).toContain('Netflix Inc.');
  });
});
