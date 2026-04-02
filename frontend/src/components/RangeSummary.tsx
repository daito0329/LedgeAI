import React from 'react';
import type { Transaction } from '../types';

interface Props {
  rangeStart: string;
  rangeEnd: string;
  transactions: Transaction[];
}

export const RangeSummary: React.FC<Props> = ({ rangeStart, rangeEnd, transactions }) => {
  const filtered = transactions.filter(t => t.date >= rangeStart && t.date <= rangeEnd);

  const income = filtered
    .filter(t => t.transaction_type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const expense = filtered
    .filter(t => t.transaction_type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const txCount = filtered.length;

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  return (
    <div className="range-summary">
      <div className="range-summary-header">
        <span className="range-badge">📊 期間集計</span>
        <span className="range-dates">{fmtDate(rangeStart)} 〜 {fmtDate(rangeEnd)}</span>
      </div>
      <div className="range-stats">
        <div className="range-stat">
          <span className="range-stat-label">収入</span>
          <span className="range-stat-value income">¥{income.toLocaleString()}</span>
        </div>
        <div className="range-stat">
          <span className="range-stat-label">支出</span>
          <span className="range-stat-value expense">¥{expense.toLocaleString()}</span>
        </div>
        <div className="range-stat">
          <span className="range-stat-label">収支</span>
          <span className={`range-stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
            ¥{balance.toLocaleString()}
          </span>
        </div>
        <div className="range-stat">
          <span className="range-stat-label">件数</span>
          <span className="range-stat-value">{txCount}件</span>
        </div>
      </div>
    </div>
  );
};
