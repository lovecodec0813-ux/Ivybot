const express = require("express");

const app = express();
app.use(express.json());

const TOKEN = "1zVRu/nj7CoR1tAyGWX8B5fcpE8ykdxFMDIoWUt3uu05OqZgPvUXvOdmLFnUou11CZQAUUd5XZuQmTXLBT9Q192T8dH7w6GNtL12x1K7W65FWMzQQvmTYBgH/zD1PaWMFlpYp9AVQPkHliGNYanytwdB04t89/1O/w1cDnyilFU=";

app.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const text = event.message.text;

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + TOKEN
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
app.listen(port, () => console.log("running"));
