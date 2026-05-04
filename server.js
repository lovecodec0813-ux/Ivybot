const express = require("express");

const app = express();

// ⚠️ LINE 一定要 JSON middleware
app.use(express.json());

app.post("/webhook", (req, res) => {
  console.log("===== WEBHOOK HIT =====");
  console.log("BODY:", JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("running"));
