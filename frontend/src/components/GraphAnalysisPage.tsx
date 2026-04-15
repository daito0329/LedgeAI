import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8B5CF6', '#EC4899', '#F43F5E', '#10B981', 
  '#3B82F6', '#6366F1'
];

const AI_API_BASE = 'http://localhost:8000';

export const GraphAnalysisPage: React.FC<Props> = ({ transactions }) => {
  const [rangeStart, setRangeStart] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [rangeEnd, setRangeEnd] = useState(() => {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  });

  const [predictions, setPredictions] = useState<{date: string, predicted_amount: number}[]>([]);

  // AI予測データの取得
  useEffect(() => {
    const fetchPredictions = async () => {
      const expenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .map(t => ({ date: t.date, amount: t.amount }));

      if (expenses.length < 2) return; // Not enough data for Prophet

      try {
        const res = await fetch(`${AI_API_BASE}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: expenses, days_to_predict: 30 })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.predictions) {
            setPredictions(data.predictions);
          }
        }
      } catch (err) {
        console.error('Failed to fetch predictions', err);
      }
    };
    fetchPredictions();
  }, [transactions]);

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

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  // Pie Chart Data
  const pieData = useMemo(() => {
    const filtered = transactions.filter(
      t => t.date >= rangeStart && t.date <= rangeEnd && t.transaction_type === 'expense'
    );
    
    const map = new Map<string, number>();
    filtered.forEach(t => {
      map.set(t.title, (map.get(t.title) || 0) + t.amount);
    });
    
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, rangeStart, rangeEnd]);

  const totalExpense = pieData.reduce((sum, item) => sum + item.value, 0);

  // Time Series Data with Predictions
  const trendData = useMemo(() => {
    const nowStr = new Date().toISOString().split('T')[0];
    const arr = [];
    
    const actualsByDate = new Map<string, number>();
    const predictsByDate = new Map<string, number>();
    
    transactions.forEach(t => {
      if (t.transaction_type === 'expense') {
        actualsByDate.set(t.date, (actualsByDate.get(t.date) || 0) + t.amount);
      }
    });

    predictions.forEach(p => {
      predictsByDate.set(p.date, p.predicted_amount);
    });

    let d = new Date(rangeStart + 'T00:00:00');
    const endD = new Date(rangeEnd + 'T00:00:00');

    // グラフの破綻を防ぐため日付の上限を100日程度に制限
    let maxDays = 100;
    while (d <= endD && maxDays > 0) {
      const dStr = d.toISOString().split('T')[0];
      const isFuture = dStr > nowStr;
      
      arr.push({
        date: dStr,
        displayDate: d.getDate() + '日',
        actual: isFuture ? undefined : (actualsByDate.get(dStr) || 0),
        predict: predictsByDate.get(dStr) || undefined
      });
      
      d.setDate(d.getDate() + 1);
      maxDays--;
    }
    return arr;
  }, [transactions, predictions, rangeStart, rangeEnd]);

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalExpense) * 100).toFixed(1);
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: '#f8fafc' }}>
          <p className="label" style={{ fontWeight: 'bold', marginBottom: '8px' }}>{`${data.name}`}</p>
          <p className="value" style={{ color: '#ef4444' }}>{`¥${data.value.toLocaleString()}`}</p>
          <p className="percentage" style={{ color: '#94a3b8', fontSize: '0.9em' }}>{`${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  const trendTooltipFormat = (value: number, name: string) => [
    `¥${Math.round(value).toLocaleString()}`, 
    name
  ];

  return (
    <div className="analysis-page">
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

      {/* 予測トレンドグラフ */}
      <div className="chart-container" style={{ marginTop: '1rem', height: '400px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '1rem', border: '1px solid #334155' }}>
        <h3 className="breakdown-title expense-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>日々の実績とAI予測トレンド</h3>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis dataKey="displayDate" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              formatter={trendTooltipFormat}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }}/>
            <Bar 
              dataKey="actual" 
              name="実績 (実費)" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
            <Line 
              type="monotone" 
              dataKey="predict" 
              name="AI季節性トレンド" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              strokeDasharray="5 5" 
              dot={false}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 円グラフ */}
      <div className="chart-container" style={{ marginTop: '2rem', height: '400px', backgroundColor: '#1e293b', borderRadius: '16px', padding: '1rem', border: '1px solid #334155' }}>
        <h3 className="breakdown-title expense-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>カテゴリ別 消費割合 (支出)</h3>
        {pieData.length === 0 ? (
          <div className="breakdown-empty" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>データなし</div>
        ) : (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={130}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }}/>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
