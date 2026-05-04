const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.post("/webhook", (req, res) => {
  console.log("Webhook hit");
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server running on " + port);
});
