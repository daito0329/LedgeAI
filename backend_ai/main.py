from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import time
import pandas as pd
from prophet import Prophet
import httpx
import json

app = FastAPI(title="LedgeAI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Service is running", "timestamp": time.time()}

@app.get("/ping")
def ping():
    return {"ping": "pong from FastAPI!"}

class TransactionData(BaseModel):
    date: str
    amount: float

class PredictRequest(BaseModel):
    transactions: List[TransactionData]
    days_to_predict: int = 30

@app.post("/predict")
def predict_trend(req: PredictRequest):
    if len(req.transactions) < 2:
        return {"predictions": []}
    
    try:
        # Convert to DataFrame
        data = [{"ds": t.date, "y": t.amount} for t in req.transactions]
        df = pd.DataFrame(data)
        
        # Group by date and sum to get daily total
        df = df.groupby('ds').sum().reset_index()
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Initialize Prophet (disable some strict seasonalities to avoid errors on sparse data)
        m = Prophet(daily_seasonality=False, yearly_seasonality=False)
        m.fit(df)
        
        # Predict future
        future = m.make_future_dataframe(periods=req.days_to_predict)
        forecast = m.predict(future)
        
        # Return predicted yhat
        res = []
        for _, row in forecast.iterrows():
            res.append({
                "date": row['ds'].strftime("%Y-%m-%d"),
                "predicted_amount": round(max(0, row['yhat']), 2) # Don't return negative spend
            })
        return {"predictions": res}
    except Exception as e:
        print(f"Prophet error: {str(e)}")
        return {"error": str(e), "predictions": []}


# ============ Chat (Ollama) ============

OLLAMA_URL = "http://host.docker.internal:11434"
OLLAMA_MODEL = "qwen3.5:9b"

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class TransactionSummary(BaseModel):
    title: str
    amount: float
    transaction_type: str
    date: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    transactions: Optional[List[TransactionSummary]] = []


def build_system_prompt(transactions: List[TransactionSummary]) -> str:
    """家計データをシステムプロンプトに埋め込む"""
    base = (
        "あなたは家計管理のプロフェッショナルなAIアシスタントです。"
        "ユーザーの家計データを参照しながら、具体的で実践的なアドバイスを日本語で提供してください。"
        "回答は簡潔かつ分かりやすく、必要に応じて数字を引用してください。\n\n"
    )
    if not transactions:
        return base + "現在、取引データはありません。"

    # 収支サマリーを計算
    income = sum(t.amount for t in transactions if t.transaction_type == "income")
    expense = sum(t.amount for t in transactions if t.transaction_type == "expense")
    balance = income - expense

    # カテゴリ別支出 top 5
    expense_by_title: dict = {}
    for t in transactions:
        if t.transaction_type == "expense":
            expense_by_title[t.title] = expense_by_title.get(t.title, 0) + t.amount
    top_expenses = sorted(expense_by_title.items(), key=lambda x: x[1], reverse=True)[:5]

    summary = f"""## ユーザーの家計データ（直近の取引 {len(transactions)} 件）
- 総収入: {income:,.0f}円
- 総支出: {expense:,.0f}円
- 収支差: {balance:,.0f}円 ({'黒字' if balance >= 0 else '赤字'})

### 支出の多い項目 TOP5
"""
    for title, amount in top_expenses:
        summary += f"- {title}: {amount:,.0f}円\n"

    return base + summary


@app.post("/chat")
async def chat(req: ChatRequest):
    """Ollamaにチャットリクエストを送信してレスポンスをストリーミング返却"""
    system_prompt = build_system_prompt(req.transactions or [])

    # Ollama API形式に変換
    messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages:
        messages.append({"role": msg.role, "content": msg.content})

    async def stream_response():
        in_think_block = False  # <think>...</think> タグをスキップするフラグ
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{OLLAMA_URL}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": messages,
                        "stream": True,
                        "think": False,          # 思考モードOFF → 即座に返答開始
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.8,
                            "top_k": 20,
                            "num_predict": 1024,  # 最大トークン数を制限して高速化
                        }
                    },
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                token = data.get("message", {}).get("content", "")
                                if token:
                                    # <think>ブロックをスキップ（思考モードが有効だった場合の保険）
                                    if "<think>" in token:
                                        in_think_block = True
                                    if in_think_block:
                                        if "</think>" in token:
                                            in_think_block = False
                                        continue
                                    yield token
                                if data.get("done"):
                                    break
                            except json.JSONDecodeError:
                                continue
        except httpx.ConnectError:
            yield "[エラー] Ollamaに接続できません。`ollama serve` が起動しているか確認してください。"
        except Exception as e:
            yield f"[エラー] {str(e)}"

    return StreamingResponse(stream_response(), media_type="text/plain")


@app.get("/ollama/status")
async def ollama_status():
    """Ollamaの起動状態とモデル一覧を確認"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{OLLAMA_URL}/api/tags")
            models = res.json().get("models", [])
            model_names = [m["name"] for m in models]
            has_qwen = any("qwen3" in n for n in model_names)
            return {
                "ollama": "online",
                "models": model_names,
                "qwen3_ready": has_qwen
            }
    except Exception:
        return {"ollama": "offline", "models": [], "qwen3_ready": False}
