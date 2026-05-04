const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "填你的Channel Access Token";

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  if (!events) return res.sendStatus(200);

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;

      await axios.post(
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
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }
  }

  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Bot running on " + port);
});
