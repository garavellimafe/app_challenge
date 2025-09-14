# config_itens.py
from __future__ import annotations
import os
import json
from io import BytesIO
from flask import Flask, request, jsonify, send_file, send_from_directory, session, redirect
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ---------------- Configuração básica ----------------
app = Flask(__name__)
CORS(app)

# Configuração do Gemini AI
load_dotenv()
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY não encontrada no arquivo .env")
    raise ValueError("GOOGLE_API_KEY não configurada")

# Configura o modelo
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    
    # Inicializa o modelo com gemini-1.5-flash
    safety_settings = [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_MEDIUM_AND_ABOVE"
        }
    ]
    
    model = genai.GenerativeModel('gemini-1.5-flash',
                                safety_settings=safety_settings)
    
    # Teste inicial do modelo
    response = model.generate_content("Test message")
    logger.info("Modelo Gemini configurado com sucesso")
except Exception as e:
    logger.error(f"Erro ao configurar modelo Gemini: {str(e)}")
    raise

# Configurações da aplicação
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# ---------------- Rotas de páginas ----------------
@app.get("/")
def root():
    return send_from_directory(BASE_DIR, "pginicial.html")

@app.get("/cadastro")
def page_cadastro():
    return send_from_directory(BASE_DIR, "cadastro.html")

@app.get("/cadastrado")
def page_cadastrado():
    return send_from_directory(BASE_DIR, "cadastrado.html")

@app.get("/<path:path>")
def static_files(path: str):
    full = os.path.join(BASE_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(BASE_DIR, path)
    return "Not Found", 404

# ---------------- API Endpoints ----------------
@app.route("/api/test")
def test():
    """Test endpoint to check if server is running"""
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route("/api/chat", methods=['POST', 'OPTIONS'])
def chat():
    """Handle chat messages with Gemini AI"""
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response

    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
            
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Mensagem não fornecida"}), 400

        user_message = data['message']
        session_id = data.get('session_id')
        context = data.get('context', {})

        # Prepare the prompt
        system_message = """Você é um assistente virtual especializado em produtos GoodWe.
        Você deve ajudar os usuários com informações sobre inversores solares e outros produtos GoodWe.
        Responda de forma clara e profissional."""
        
        # Combine context and message
        full_prompt = f"{system_message}\n\nContexto:\n{context}\n\nUsuário: {user_message}"
        
        try:
            # Generate response
            response = model.generate_content(full_prompt)
            
            if not response or not response.text:
                raise ValueError("Resposta vazia do modelo")
            
            return jsonify({
                "response": response.text,
                "session_id": session_id
            })
        except Exception as e:
            logger.error(f"Erro ao gerar resposta: {str(e)}")
            return jsonify({"error": "Erro ao gerar resposta"}), 500
            
    except Exception as e:
        logger.error(f"Erro no endpoint de chat: {str(e)}")
        return jsonify({"error": "Erro interno do servidor"}), 500

if __name__ == "__main__":
    print("Servidor iniciado em http://127.0.0.1:5000 ...")
    app.run(debug=True, use_reloader=False)
