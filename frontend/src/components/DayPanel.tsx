import { useState, useEffect } from 'react';
import type { Transaction, NewTransaction, Item } from '../types';
import { API_BASE } from '../constants';

interface Props {
  selectedDate: string;
  transactions: Transaction[];
  onAdd: (tx: NewTransaction) => void;
  onDelete: (id: number) => void;
}

export const DayPanel: React.FC<Props> = ({ selectedDate, transactions, onAdd, onDelete }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [items, setItems] = useState<Item[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/items`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const dayTxs = transactions.filter(t => t.date === selectedDate);

  const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = isAddingNew ? newItemName : title;
    if (!finalTitle || !amount) return;

    if (isAddingNew) {
      try {
        await fetch(`${API_BASE}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { name: finalTitle } })
        });
        fetchItems();
      } catch (err) {
        console.error('Error registering item:', err);
      }
    }

    onAdd({
      title: finalTitle,
      amount: parseInt(amount, 10),
      transaction_type: type,
      date: selectedDate,
    });

    setTitle('');
    setNewItemName('');
    setIsAddingNew(false);
    setAmount('');
  };

  return (
    <div className="day-panel">
      <h3 className="day-panel-date">{dateLabel}</h3>

      {/* Quick add form */}
      <form className="day-form" onSubmit={handleSubmit}>
        <div className="day-form-type">
          <button
            type="button"
            className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            支出
          </button>
          <button
            type="button"
            className={`type-btn income ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            収入
          </button>
        </div>
        <div className="day-form-row">
          {isAddingNew ? (
            <div style={{ display: 'flex', gap: '4px', flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="新しいモノの名前"
                className="day-input title-input"
                style={{ flex: 1, minWidth: 0 }}
                required
              />
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)}
                className="day-input"
                style={{ padding: '0 8px', fontSize: '0.8rem', flexShrink: 0, cursor: 'pointer', backgroundColor: 'var(--glass-bg)', color: 'var(--text-light)', border: '1px solid var(--glass-border)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <select
              value={title}
              onChange={e => {
                if (e.target.value === '__ADD_NEW__') {
                  setIsAddingNew(true);
                  setTitle('');
                } else {
                  setTitle(e.target.value);
                }
              }}
              className="day-input title-input"
              required
            >
              <option value="" disabled>選んでください</option>
              {items.map(item => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
              <option value="__ADD_NEW__">+ 新しいモノを追加...</option>
            </select>
          )}
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="¥ 金額"
            className="day-input amount-input"
            min="1"
            required
          />
          <button type="submit" className="day-add-btn">追加</button>
        </div>
      </form>

      {/* Day's transactions */}
      <div className="day-tx-list">
        {dayTxs.length === 0 ? (
          <div className="day-empty">この日の記録はまだありません</div>
        ) : (
          dayTxs.map(tx => (
            <div key={tx.id} className="day-tx-item">
              <div className="day-tx-info">
                <span className="day-tx-title">{tx.title}</span>
              </div>
              <div className="day-tx-right">
                <span className={`day-tx-amount ${tx.transaction_type}`}>
                  {tx.transaction_type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                </span>
                <button className="delete-btn" onClick={() => onDelete(tx.id)} title="削除">✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
