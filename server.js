// backend/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config(); // Carrega variáveis do arquivo .env

const app = express();
const PORT = 3080;

app.use(cors());
app.use(express.json());

// OpenAI SDK v4
const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Usa a chave da variável de ambiente
});

app.post('/api/assistente', async (req, res) => {
    const { mensagem } = req.body;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // ou "gpt-4" se disponível
            messages: [{ role: "user", content: mensagem }]
        });
        const resposta = completion.choices[0].message.content;
        res.json({ resposta });
    } catch (err) {
        console.error("Erro na chamada à OpenAI:", err);
        res.json({ resposta: "[Erro ao conectar com a IA]" });
    }
});

app.listen(PORT, () => {
    console.log(`Assistente Virtual backend rodando em http://localhost:${PORT}`);
});
