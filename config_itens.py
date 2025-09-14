# config_itens.p# Configuração básica ----------------
app = Flask(__name__)
CORS(app, supports_credentials=True)  # Simplified CORS for testing_future__ import annotations
import os
import json
import re
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
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5000", "http://localhost:5000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

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

# ---------------- Funções auxiliares ----------------
def load_users():
    """Load users from the JSON file"""
    users_file = os.path.join(DOWNLOADS_DIR, 'users.json')
    if os.path.exists(users_file):
        with open(users_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_users(users):
    """Save users to the JSON file"""
    users_file = os.path.join(DOWNLOADS_DIR, 'users.json')
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def generate_username(nome, users):
    """Generate a unique username from the name"""
    base = re.sub(r'[^a-zA-Z0-9]', '', nome.lower())
    username = base
    counter = 1
    
    # Keep adding numbers until we find a unique username
    while any(u.get('username') == username for u in users):
        username = f"{base}{counter}"
        counter += 1
        
    return username

# ---------------- API Endpoints ----------------
@app.route("/api/test")
def test():
    """Test endpoint to check if server is running"""
    return jsonify({"status": "ok", "message": "Server is running"})

@app.route("/api/login", methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"ok": False, "error": "Dados inválidos"}), 400
            
        ident = data.get('ident')
        senha = data.get('senha')
        
        if not ident or not senha:
            return jsonify({"ok": False, "error": "Identificação e senha são obrigatórios"}), 400
            
        # Load users
        users = load_users()
        if not users:
            return jsonify({"ok": False, "error": "Usuário não encontrado"}), 401
            
        # Find user by CPF, username, or email
        user = None
        for u in users:
            if u['cpf'] == ident or u.get('username') == ident or u['email'] == ident:
                if u['senha'] == senha:
                    user = u
                    break
                    
        if not user:
            return jsonify({"ok": False, "error": "Credenciais inválidas"}), 401
            
        return jsonify({
            "ok": True,
            "user": {
                "nome": user['nome'],
                "username": user.get('username', ''),
                "cpf": user['cpf']
            }
        })
        
    except Exception as e:
        logger.error(f"Erro no login: {str(e)}")
        return jsonify({"ok": False, "error": "Erro interno do servidor"}), 500

@app.route("/api/cadastro", methods=['POST', 'OPTIONS'])
def cadastro():
    """Handle user registration"""
    if request.method == 'OPTIONS':
        return '', 204

    if not request.is_json:
        return jsonify({"ok": False, "error": "Content-Type deve ser application/json"}), 400
        
    try:
        data = request.get_json()
        logger.debug(f"Received registration data: {data}")
        
        # Only these fields are required
        nome = data.get('nome', '').strip()
        email = data.get('email', '').strip()
        cpf = data.get('cpf', '').strip()
        senha = data.get('senha', '')
        
        # Debug log the received fields
        logger.debug(f"Processed fields: nome={nome}, email={email}, cpf={cpf}, senha={'*' * len(senha) if senha else 'empty'}")
        
        # Check each required field individually for better error messages
        missing_fields = []
        if not nome: missing_fields.append("nome")
        if not email: missing_fields.append("email")
        if not cpf: missing_fields.append("cpf")
        if not senha: missing_fields.append("senha")
        
        if missing_fields:
            error_msg = f"Por favor, preencha os seguintes campos: {', '.join(missing_fields)}"
            logger.debug(f"Missing fields in request: {missing_fields}")
            return jsonify({"ok": False, "error": error_msg}), 400
            
        # Normalize data
        nome = data['nome'].strip()
        email = data['email'].strip().lower()
        cpf = data['cpf'].strip()
        senha = data['senha']
        
        # Validate data
        if len(nome) < 2:
            return jsonify({"ok": False, "error": "Nome deve ter pelo menos 2 caracteres"}), 400
            
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({"ok": False, "error": "E-mail inválido"}), 400
            
        if not re.match(r'^\d{11}$', cpf):
            return jsonify({"ok": False, "error": "CPF deve conter 11 dígitos"}), 400
            
        if len(senha) < 4:
            return jsonify({"ok": False, "error": "Senha deve ter pelo menos 4 caracteres"}), 400
            
        # Load existing users
        users = load_users()
        
        # Check for existing email/CPF
        for user in users:
            if user['cpf'] == cpf:
                return jsonify({"ok": False, "error": "CPF já cadastrado"}), 400
            if user['email'] == email:
                return jsonify({"ok": False, "error": "E-mail já cadastrado"}), 400
        
        # Generate or validate username
        username = data.get('username', '').strip()
        if username:
            if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
                return jsonify({"ok": False, "error": "Nome de usuário inválido"}), 400
            if any(u.get('username') == username for u in users):
                return jsonify({"ok": False, "error": "Nome de usuário já existe"}), 400
        else:
            username = generate_username(nome, users)
            
        # Create new user
        new_user = {
            'nome': nome,
            'email': email,
            'username': username,
            'cpf': cpf,
            'senha': senha
        }
        
        # Add to users list and save
        users.append(new_user)
        save_users(users)
        
        # Create credentials file
        credentials_content = f"""Suas credenciais de acesso:
Nome: {nome}
Username: {username}
CPF: {cpf}
Senha: {senha}"""

        credentials_filename = f"{username}_credenciais.txt"
        credentials_path = os.path.join(DOWNLOADS_DIR, credentials_filename)
        
        with open(credentials_path, 'w', encoding='utf-8') as f:
            f.write(credentials_content)
            
        return jsonify({
            "ok": True,
            "user": {
                "nome": nome,
                "username": username,
                "cpf": cpf
            },
            "senha": senha,
            "txt_filename": credentials_filename,
            "txt_content": credentials_content
        })
            
        # Return error
    except Exception as e:
        logger.error(f"Erro no cadastro: {str(e)}")
        return jsonify({"ok": False, "error": "Erro interno do servidor"}), 500@app.route("/api/chat", methods=['POST', 'OPTIONS'])
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
