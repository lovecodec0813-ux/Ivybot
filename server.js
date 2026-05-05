const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const LINE_TOKEN = "NxvcK+H+5ZSdkLRVQjQRZkaUNMlCGEWY/20ap3wi1OiYiCFfnLkZ1q97uvCP5zxlCZQAUUd5XZuQmTXLBT9Q192T8dH7w6GNtL12x1K7W67G0MAIbAK5r/nIJpQSkON5EFe4/Dd3oJASENwLXVEOpgdB04t89/1O/w1cDnyilFU=";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// PostgreSQL（Render 會給你連線字串）
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 📈 股票資料（改用較穩來源：Finnhub）
const STOCK_API = "https://finnhub.io/api/v1/quote";
const STOCK_KEY = "你的FINNHUB KEY";

async function getStock(code) {
  const res = await axios.get(STOCK_API, {
    params: { symbol: code + ".TW", token: STOCK_KEY }
  });

  return res.data; // c: current price
}

// 📊 策略（簡化版）
function strategy(price, prev) {
  if (price > prev) return "📈 多方偏強，可觀察拉回";
  if (price < prev) return "📉 偏弱，建議保守";
  return "⚖️ 盤整中";
}

// 🤖 AI
async function ai(text) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "你是股票助理，回答簡潔且專業" },
        { role: "user", content: text }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    }
  );
  return res.data.choices[0].message.content;
}

// 🔔 建立資料表（第一次跑）
pool.query(`
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  code TEXT,
  target FLOAT
);
`);

// 🔔 檢查提醒
setInterval(async () => {
  const result = await pool.query("SELECT * FROM alerts");

  for (const row of result.rows) {
    const stock = await getStock(row.code);

    if (stock.c >= row.target) {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: row.user_id,
          messages: [
            { type: "text", text: `${row.code} 到價 ${stock.c}` }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${LINE_TOKEN}`
          }
        }
      );

      await pool.query("DELETE FROM alerts WHERE id=$1", [row.id]);
    }
  }
}, 60000);

// 🌐 webhook
app.post("/webhook", async (req, res) => {
  const event = req.body.events[0];
  if (!event) return res.sendStatus(200);

  const text = event.message.text;
  const userId = event.source.userId;

  let replyText = "";

  if (/^\d{4}$/.test(text)) {
    const stock = await getStock(text);
    replyText =
`${text} 現價：${stock.c}
漲跌：${stock.d}
${strategy(stock.c, stock.pc)}`;
  }

  else if (/^提醒/.test(text)) {
    const [_, code, target] = text.split(" ");
    await pool.query(
      "INSERT INTO alerts(user_id, code, target) VALUES($1,$2,$3)",
      [userId, code, target]
    );
    replyText = "提醒已設定";
  }

  else {
    replyText = await ai(text);
  }

  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken: event.replyToken,
      messages: [{ type: "text", text: replyText }]
    },
    {
      headers: { Authorization: `Bearer ${LINE_TOKEN}` }
    }
  );

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
