import React, { useState } from 'react';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const Calendar: React.FC<Props> = ({ transactions, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthName = currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const formatDateStr = (day: number): string =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayTransactions = (day: number): Transaction[] => {
    const dateStr = formatDateStr(day);
    return transactions.filter(t => t.date === dateStr);
  };

  const getDayTotal = (dayTxs: Transaction[]) => {
    let income = 0, expense = 0;
    dayTxs.forEach(t => {
      if (t.transaction_type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense };
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-cell cal-cell-empty" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(day);
    const dayTxs = getDayTransactions(day);
    const totals = getDayTotal(dayTxs);
    const isSelected = selectedDate === dateStr;
    const isSunday = (firstDayOfWeek + day - 1) % 7 === 0;
    const isSaturday = (firstDayOfWeek + day - 1) % 7 === 6;

    cells.push(
      <div
        key={day}
        className={`cal-cell ${isSelected ? 'cal-selected' : ''} ${isToday(day) ? 'cal-today' : ''}`}
        onClick={() => onSelectDate(dateStr)}
      >
        <span className={`cal-day-num ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''}`}>
          {day}
        </span>
        {dayTxs.length > 0 && (
          <div className="cal-day-amounts">
            {totals.income > 0 && <span className="cal-amount income">+¥{totals.income.toLocaleString()}</span>}
            {totals.expense > 0 && <span className="cal-amount expense">-¥{totals.expense.toLocaleString()}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <h2 className="cal-month-title">{monthName}</h2>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-weekdays">
        {weekDays.map((d, i) => (
          <div key={d} className={`cal-weekday ${i === 0 ? 'sunday' : ''} ${i === 6 ? 'saturday' : ''}`}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">{cells}</div>
    </div>
  );
};
