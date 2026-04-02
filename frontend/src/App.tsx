import { useEffect, useState } from 'react';
import { Calendar } from './components/Calendar';
import { DayPanel } from './components/DayPanel';
import { AnalysisPage } from './components/AnalysisPage';
import type { Transaction, NewTransaction } from './types';
import './index.css';

const API_BASE = 'http://localhost:3001';
const AI_API_BASE = 'http://localhost:8000';

type Page = 'input' | 'analysis';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setAiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [page, setPage] = useState<Page>('input');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchTransactions();
    checkAiStatus();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      if (res.ok) {
        const data: Transaction[] = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const checkAiStatus = async () => {
    try {
      const res = await fetch(`${AI_API_BASE}/ping`);
      setAiStatus(res.ok ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  };

  const addTransaction = async (tx: NewTransaction) => {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx }),
      });
      if (res.ok) fetchTransactions();
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <h1>Budget Book AI</h1>
          {/* <div className="ai-status">
            <div className={`status-dot ${aiStatus}`} />
            AI: {aiStatus === 'checking' ? '...' : aiStatus === 'online' ? 'ON' : 'OFF'}
          </div> */}
        </div>
        <nav className="page-nav">
          <button
            className={`nav-btn ${page === 'input' ? 'active' : ''}`}
            onClick={() => setPage('input')}
          >
            入力
          </button>
          <button
            className={`nav-btn ${page === 'analysis' ? 'active' : ''}`}
            onClick={() => setPage('analysis')}
          >
            管理
          </button>
        </nav>
      </header>

      {page === 'input' && (
        <div className="main-layout">
          <Calendar
            transactions={transactions}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <DayPanel
            selectedDate={selectedDate}
            transactions={transactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
          />
        </div>
      )}

      {page === 'analysis' && (
        <AnalysisPage transactions={transactions} />
      )}
    </div>
  );
}

export default App;
