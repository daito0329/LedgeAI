import React, { useState } from 'react';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

export const AnalysisPage: React.FC<Props> = ({ transactions }) => {
  const [rangeStart, setRangeStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [rangeEnd, setRangeEnd] = useState(() => {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  });

  const filtered = transactions.filter(t => t.date >= rangeStart && t.date <= rangeEnd);

  const totalIncome = filtered
    .filter(t => t.transaction_type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter(t => t.transaction_type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Group by title
  const groupByTitle = (type: 'income' | 'expense') => {
    const map = new Map<string, number>();
    filtered
      .filter(t => t.transaction_type === type)
      .forEach(t => {
        map.set(t.title, (map.get(t.title) || 0) + t.amount);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  const expenseBreakdown = groupByTitle('expense');
  const incomeBreakdown = groupByTitle('income');

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // Preset buttons
  const setThisMonth = () => {
    const now = new Date();
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setRangeStart(first);
    setRangeEnd(`${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`);
  };

  const setLastMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    setRangeStart(`${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`);
    setRangeEnd(`${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`);
  };

  const setThisYear = () => {
    const now = new Date();
    setRangeStart(`${now.getFullYear()}-01-01`);
    setRangeEnd(`${now.getFullYear()}-12-31`);
  };

  const barMax = Math.max(...expenseBreakdown.map(e => e[1]), 1);
  const incomeBarMax = Math.max(...incomeBreakdown.map(e => e[1]), 1);

  return (
    <div className="analysis-page">
      {/* Date range picker */}
      <div className="analysis-range-picker">
        <div className="range-inputs">
          <div className="range-field">
            <label>開始日</label>
            <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
          </div>
          <span className="range-separator">〜</span>
          <div className="range-field">
            <label>終了日</label>
            <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
          </div>
        </div>
        <div className="range-presets">
          <button onClick={setThisMonth} className="preset-btn">今月</button>
          <button onClick={setLastMonth} className="preset-btn">先月</button>
          <button onClick={setThisYear} className="preset-btn">今年</button>
        </div>
      </div>

      <div className="analysis-period">
        {fmtDate(rangeStart)} 〜 {fmtDate(rangeEnd)}
      </div>

      {/* Summary cards */}
      <div className="analysis-summary">
        <div className="analysis-card">
          <span className="analysis-card-label">収入合計</span>
          <span className="analysis-card-value income">¥{totalIncome.toLocaleString()}</span>
        </div>
        <div className="analysis-card">
          <span className="analysis-card-label">支出合計</span>
          <span className="analysis-card-value expense">¥{totalExpense.toLocaleString()}</span>
        </div>
        <div className="analysis-card wide">
          <span className="analysis-card-label">収支</span>
          <span className={`analysis-card-value ${balance >= 0 ? 'income' : 'expense'}`}>
            ¥{balance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Breakdown sections */}
      <div className="breakdown-grid">
        {/* Expense breakdown */}
        <div className="breakdown-section">
          <h3 className="breakdown-title expense-title">支出の内訳</h3>
          {expenseBreakdown.length === 0 ? (
            <div className="breakdown-empty">データなし</div>
          ) : (
            <div className="breakdown-list">
              {expenseBreakdown.map(([title, amount]) => (
                <div key={title} className="breakdown-item">
                  <div className="breakdown-item-header">
                    <span className="breakdown-item-title">{title}</span>
                    <span className="breakdown-item-amount expense">¥{amount.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div
                      className="breakdown-bar expense"
                      style={{ width: `${(amount / barMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income breakdown */}
        <div className="breakdown-section">
          <h3 className="breakdown-title income-title">収入の内訳</h3>
          {incomeBreakdown.length === 0 ? (
            <div className="breakdown-empty">データなし</div>
          ) : (
            <div className="breakdown-list">
              {incomeBreakdown.map(([title, amount]) => (
                <div key={title} className="breakdown-item">
                  <div className="breakdown-item-header">
                    <span className="breakdown-item-title">{title}</span>
                    <span className="breakdown-item-amount income">¥{amount.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div
                      className="breakdown-bar income"
                      style={{ width: `${(amount / incomeBarMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction list for range */}
      {filtered.length > 0 && (
        <div className="analysis-tx-section">
          <h3 className="breakdown-title">取引一覧（{filtered.length}件）</h3>
          <div className="analysis-tx-list">
            {filtered
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(tx => (
                <div key={tx.id} className="analysis-tx-item">
                  <span className="analysis-tx-date">
                    {new Date(tx.date + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="analysis-tx-title">{tx.title}</span>
                  <span className={`analysis-tx-amount ${tx.transaction_type}`}>
                    {tx.transaction_type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
