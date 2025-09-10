from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configura a API da Gemini
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")
    print("Modelo da Gemini carregado com sucesso.")
except Exception as e:
    print(f"Erro ao configurar a API da Gemini: {e}")
    model = None

# Cria a aplicação Flask
app = Flask(__name__)
CORS(app)  # Habilita o CORS para permitir requisições do frontend

# Define a rota para o assistente virtual
@app.route("/api/assistente", methods=["POST"])
def assistente():
    if not model:
        return jsonify({"erro": "Modelo de IA não foi inicializado corretamente."}), 500

    try:
        # Pega a mensagem do corpo da requisição JSON
        dados = request.get_json()
        mensagem_usuario = dados.get("mensagem")

        if not mensagem_usuario:
            return jsonify({"erro": "Nenhuma mensagem fornecida."}), 400

        # Gera a resposta usando o modelo da Gemini
        response = model.generate_content(mensagem_usuario)
        
        # Retorna a resposta da IA em formato JSON
        return jsonify({"resposta": response.text})

    except Exception as e:
        print(f"Ocorreu um erro no endpoint /api/assistente: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor."}), 500

# Inicia o servidor Flask
if __name__ == "__main__":
    # O servidor irá rodar na porta 3080 para corresponder ao frontend
    app.run(host="0.0.0.0", port=3080, debug=True)
