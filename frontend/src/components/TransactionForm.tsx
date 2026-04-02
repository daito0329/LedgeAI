import React, { useState, useEffect } from 'react';
import type { NewTransaction, Item } from '../types';

const API_BASE = 'http://localhost:3001';

interface Props {
  onAdd: (tx: NewTransaction) => void;
}

export const TransactionForm: React.FC<Props> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
      date
    });
    
    setTitle('');
    setNewItemName('');
    setIsAddingNew(false);
    setAmount('');
  };

  return (
    <div className="glass-panel">
      <h2>Add Transaction</h2>
      <form onSubmit={handleSubmit}>
        <div className="type-selector">
          <button 
            type="button" 
            className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button 
            type="button" 
            className={`type-btn income ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>

        <div className="form-group">
          <label>Title</label>
          {isAddingNew ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={newItemName} 
                onChange={e => setNewItemName(e.target.value)} 
                placeholder="新しいモノの名前"
                required
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)} 
                style={{ padding: '0.8rem', background: 'var(--glass-bg)', color: 'var(--text-light)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
              >
                戻る
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
              required
            >
              <option value="" disabled>選択してください</option>
              {items.map(item => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
              <option value="__ADD_NEW__">+ 新しいモノを追加...</option>
            </select>
          )}
        </div>

        <div className="form-group">
          <label>Amount (¥)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Add {type === 'income' ? 'Income' : 'Expense'}
        </button>
      </form>
    </div>
  );
};
