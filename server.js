const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 👉 把你「重新產生的新 token」貼在這裡
const TOKEN = "NxvcK+H+5ZSdkLRVQjQRZkaUNMlCGEWY/20ap3wi1OiYiCFfnLkZ1q97uvCP5zxlCZQAUUd5XZuQmTXLBT9Q192T8dH7w6GNtL12x1K7W67G0MAIbAK5r/nIJpQSkON5EFe4/Dd3oJASENwLXVEOpgdB04t89/1O/w1cDnyilFU=";

app.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  console.log(JSON.stringify(req.body, null, 2));

  const events = req.body.events || [];

  for (const event of events) {
    console.log("EVENT TYPE:", event.type);

    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;

      try {
        const result = await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          {
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: "你說：" + text
              }
            ]
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${TOKEN}`
            }
          }
        );

        console.log("✅ REPLY SUCCESS:", result.status);
      } catch (err) {
        console.error("❌ REPLY ERROR:", err.response?.data || err.message);
      }
    }
  }

  res.sendStatus(200);
});

// 測試用（瀏覽器打網址會看到）
app.get("/", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("running"));
