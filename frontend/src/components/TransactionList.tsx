import React from 'react';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  onDelete: (id: number) => void;
}

export const TransactionList: React.FC<Props> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
      <div className="glass-panel">
        <div className="empty-state">
          No transactions yet. Start adding!
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="transaction-list">
        {transactions.map(tx => (
          <div key={tx.id} className="transaction-item">
            <div className="tx-info">
              <h3>{tx.title}</h3>
              <div className="tx-date">{new Date(tx.date).toLocaleDateString()}</div>
            </div>
            <div className={`tx-amount ${tx.transaction_type}`}>
              {tx.transaction_type === 'income' ? '+' : '-'}
              ¥{tx.amount.toLocaleString()}
              <button 
                onClick={() => onDelete(tx.id)} 
                className="delete-btn"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
