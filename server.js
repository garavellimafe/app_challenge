const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3080;

app.use(cors());
app.use(express.json());

// Gemini SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/assistente", async (req, res) => {
  const { mensagem } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(mensagem);
    const resposta = result.response.text();

    res.json({ resposta });
  } catch (err) {
    console.error("Erro na chamada ao Gemini:", err);
    res.json({ resposta: "[Erro ao conectar com a IA]" });
  }
});

app.listen(PORT, () => {
  console.log(`Assistente Virtual rodando em http://localhost:${PORT}`);
});
