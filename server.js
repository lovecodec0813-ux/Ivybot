const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "你的Channel Access Token";

app.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

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

app.get("/", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("running"));
