const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ====== 必填 ======
const LINE_TOKEN = "NxvcK+H+5ZSdkLRVQjQRZkaUNMlCGEWY/20ap3wi1OiYiCFfnLkZ1q97uvCP5zxlCZQAUUd5XZuQmTXLBT9Q192T8dH7w6GNtL12x1K7W67G0MAIbAK5r/nIJpQSkON5EFe4/Dd3oJASENwLXVEOpgdB04t89/1O/w1cDnyilFU=";
// （可選）AI，如果你要聊天更聰明再填
const OPENAI_API_KEY = ""; // 沒填就用簡單回覆
// ==================

// 🔔 簡易提醒（記憶體版：重啟會消失）
const alerts = []; // { userId, code, target }

// 📈 台股簡易查價（示範：用 Yahoo Finance API）
async function getStockPrice(code) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.TW`;
    const res = await axios.get(url);
    const result = res.data.chart.result[0];
    const price = result.meta.regularMarketPrice;
    const name = result.meta.symbol;
    return { name, price };
  } catch (e) {
    return null;
  }
}

// 🤖 簡單 AI（沒填 OPENAI_API_KEY 就用 fallback）
async function aiReply(text) {
  if (!OPENAI_API_KEY) {
    return `我收到：${text}`;
  }
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data.choices[0].message.content;
  } catch (e) {
    return "AI 暫時忙碌中～";
  }
}

// 📩 回覆 LINE
async function reply(replyToken, text) {
  return axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,
      messages: [{ type: "text", text }]
    },
    {
      headers: {
        Authorization: `Bearer ${LINE_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// 🔔 檢查提醒（每 30 秒）
setInterval(async () => {
  for (let i = alerts.length - 1; i >= 0; i--) {
    const a = alerts[i];
    const data = await getStockPrice(a.code);
    if (!data) continue;

    if (data.price >= a.target) {
      try {
        await axios.post(
          "https://api.line.me/v2/bot/message/push",
          {
            to: a.userId,
            messages: [
              {
                type: "text",
                text: `${a.code} 到價！現在 ${data.price}（目標 ${a.target}）`
              }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${LINE_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
      } catch (e) {}

      alerts.splice(i, 1); // 觸發後移除
    }
  }
}, 30000);

// 🌐 Webhook
app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const text = event.message.text.trim();
    const userId = event.source.userId;

    let replyText = "";

    // 🙋 help
    if (text.toLowerCase() === "help") {
      replyText =
`功能：
1️⃣ 輸入股票代碼：2330
2️⃣ 分析：分析 2330
3️⃣ 設提醒：提醒 2330 600
4️⃣ 其他：AI聊天`;
    }

    // 🔔 提醒：提醒 2330 600
    else if (/^提醒\s+\d{4}\s+\d+(\.\d+)?$/.test(text)) {
      const [, code, target] = text.match(/^提醒\s+(\d{4})\s+(\d+(\.\d+)?)$/);
      alerts.push({ userId, code, target: Number(target) });
      replyText = `已設定提醒：${code} ≥ ${target}`;
    }

    // 📊 分析：分析 2330（示範版）
    else if (/^分析\s+\d{4}$/.test(text)) {
      const code = text.split(" ")[1];
      const data = await getStockPrice(code);
      if (!data) {
        replyText = "查不到這檔股票";
      } else {
        replyText =
`${code} 現價：${data.price}
（示範）建議：
- 觀察量能
- 留意支撐/壓力
- 分批進出`;
      }
    }

    // 📈 股票查價：2330
    else if (/^\d{4}$/.test(text)) {
      const data = await getStockPrice(text);
      if (!data) {
        replyText = "查不到這檔股票";
      } else {
        replyText = `${text} 現價：${data.price}`;
      }
    }

    // 🤖 其他 → AI
    else {
      replyText = await aiReply(text);
    }

    try {
      await reply(event.replyToken, replyText);
      console.log("reply ok");
    } catch (e) {
      console.error("reply error", e.response?.data || e.message);
    }
  }

  res.sendStatus(200);
});

// 測試首頁
app.get("/", (req, res) => res.send("OK"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("running"));
