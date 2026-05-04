const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("running"));
