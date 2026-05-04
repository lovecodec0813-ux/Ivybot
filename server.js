const express = require("express");

const app = express();
app.use(express.json());

const TOKEN = "你的Channel Access Token";

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  if (!events) return res.sendStatus(200);

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "你說：" + text
            }
          ]
        })
      });
    }
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Bot running"));
