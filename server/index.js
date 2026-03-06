const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

app.post("/ask", async (req, res) => {
  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        status: false,
        reply: "Message is required"
      });
    }

    const result = await model.generateContent(message);

    const reply = result.response.text();

    res.json({
      status: true,
      reply: reply
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      status: false,
      reply: "AI error occurred"
    });

  }
});

app.listen(8120, () => {
  console.log("Server running on port 8120");
});