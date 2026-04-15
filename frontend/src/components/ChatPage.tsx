import { useState, useRef, useEffect } from 'react';
import type { Transaction } from '../types';
import { AI_API_BASE } from '../constants';

interface Props {
  transactions: Transaction[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}



const SUGGESTED_QUESTIONS = [
  '今月の支出を分析してください',
  '節約できそうな項目はありますか？',
  '収支バランスについてアドバイスをください',
  '支出が多いカテゴリを教えてください',
];

export function ChatPage({ transactions }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkOllama();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkOllama = async () => {
    try {
      const res = await fetch(`${AI_API_BASE}/ollama/status`);
      const data = await res.json();
      setOllamaStatus(data.ollama === 'online' ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // assistantのplaceholderを追加
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const txSummary = transactions.map(t => ({
        title: t.title,
        amount: Number(t.amount),
        transaction_type: t.transaction_type,
        date: t.date,
      }));

      const res = await fetch(`${AI_API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          transactions: txSummary,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assembled = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assembled += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assembled };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '[エラー] メッセージの送受信に失敗しました。Ollamaが起動しているか確認してください。',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-page">
      {/* ステータスバー */}
      <div className="chat-status-bar">
        <div className="chat-status-info">
          <div className={`chat-status-dot ${ollamaStatus}`} />
          <span className="chat-model-name">Qwen3.5 9B</span>
          <span className="chat-status-label">
            {ollamaStatus === 'checking'
              ? '確認中...'
              : ollamaStatus === 'online'
              ? 'オンライン'
              : 'オフライン — ターミナルで ollama serve を実行してください'}
          </span>
        </div>
        <div className="chat-context-badge">
          <span>📊</span>
          <span>{transactions.length} 件のデータを参照中</span>
        </div>
      </div>

      {/* チャットメッセージエリア */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">💬</div>
            <h2 className="chat-welcome-title">家計AIアシスタント</h2>
            <p className="chat-welcome-desc">
              あなたの家計データを基に、節約アドバイスや支出分析をお手伝いします。
            </p>
            <div className="chat-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => sendMessage(q)}
                  disabled={ollamaStatus !== 'online'}
                >
                  {q}
                </button>
              ))}
            </div>
            {ollamaStatus === 'offline' && (
              <div className="chat-offline-warn">
                ⚠️ Ollamaが起動していません。ターミナルで <code>ollama serve</code> を実行してください。
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
              {msg.role === 'assistant' && <div className="chat-avatar">AI</div>}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content === '' && isLoading ? (
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                ) : (
                  <p className="chat-bubble-text">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          id="chat-input"
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            ollamaStatus === 'online'
              ? '家計について質問してください... (Enterで送信、Shift+Enterで改行)'
              : 'Ollamaをまず起動してください'
          }
          disabled={isLoading || ollamaStatus !== 'online'}
          rows={1}
        />
        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading || ollamaStatus !== 'online'}
        >
          {isLoading ? (
            <span className="chat-send-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
