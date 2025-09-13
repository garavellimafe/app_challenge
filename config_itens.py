# config_itens.py
# -*- coding: utf-8 -*-
from __future__ import annotations
import os, json, re, secrets, string, unicodedata
from datetime import datetime
from io import BytesIO

from flask import Flask, request, jsonify, send_file, send_from_directory, session, redirect

# ---------------- Configuração básica ----------------
app = Flask(__name__, static_folder=None)  # desabilita static_folder default
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

BASE_DIR = os.path.abspath(os.path.dirname(__file__)) if "__file__" in globals() else os.getcwd()
USERS_DB_PATH = os.path.join(BASE_DIR, "users.json")
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Mostrar a senha em texto no .txt gerado no cadastro?
SHOW_PASSWORD_IN_TXT = False

# ---------------- Validações ----------------
CPF_RE = re.compile(r"^\d{11}$")
USERNAME_RE = re.compile(r"^[a-zA-Z0-9_.-]{3,20}$")

# ---------------- Persistência ----------------
def load_users():
    if not os.path.exists(USERS_DB_PATH):
        return []
    with open(USERS_DB_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_users(users):
    with open(USERS_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def find_user_by_username(users, username):
    for u in users:
        if u["username"].lower() == username.lower():
            return u
    return None

def find_user_by_cpf(users, cpf):
    for u in users:
        if u["cpf"] == cpf:
            return u
    return None

# ---------------- Geração username/senha ----------------
import hashlib
from werkzeug.security import generate_password_hash, check_password_hash

def slugify_username_from_name(nome: str) -> str:
    nfkd = unicodedata.normalize("NFKD", nome)
    base = "".join(ch for ch in nfkd if not unicodedata.combining(ch))
    base = re.sub(r"[^a-zA-Z0-9]+", "", base).lower()
    if not base:
        base = "user"
    return base[:12]

def generate_unique_username(users, nome: str) -> str:
    base = slugify_username_from_name(nome)
    candidate, i = base, 1
    while any(u["username"].lower() == candidate.lower() for u in users):
        suffix = str(i)
        candidate = (base[:(16 - len(suffix))] + suffix)[:16]
        i += 1
    return candidate

def generate_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    pwd = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
    ]
    pwd += [secrets.choice(alphabet) for _ in range(length - len(pwd))]
    secrets.SystemRandom().shuffle(pwd)
    return "".join(pwd)

def make_txt_content(nome: str, username: str, cpf: str, senha: str) -> str:
    largura = 60
    titulo = f"Registro de {username}"
    sub = "GOODWE"
    linha = "=" * largura
    separador = "-" * largura
    senha_mostrar = senha if SHOW_PASSWORD_IN_TXT else "********"
    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    def center(t: str) -> str: return t.center(largura)

    corpo = [
        linha, center(titulo), center(sub), linha,
        f"Data/Hora: {agora}",
        separador,
        f"Nome completo : {nome}",
        f"Usuário       : {username}",
        f"CPF           : {cpf}",
        f"Senha         : {senha_mostrar}",
        separador,
        "Como acessar:",
        " - Opção 1: CPF (11 dígitos)  + Senha",
        " - Opção 2: Usuário           + Senha",
        separador,
        "Senha Criptografada",
        linha, ""
    ]
    return "\n".join(corpo)

# ---------------- Rotas de páginas (servir seus arquivos) ----------------
# Raiz -> pginicial.html
@app.get("/")
def root():
    return send_from_directory(BASE_DIR, "pginicial.html")

# Demais páginas que você já tem:
@app.get("/cadastro")
def page_cadastro():
    return send_from_directory(BASE_DIR, "cadastro.html")

@app.get("/cadastrado")
def page_cadastrado():
    return send_from_directory(BASE_DIR, "cadastrado.html")

# Rota coringa para servir seus .css/.js/.png/.jpg etc
@app.get("/<path:path>")
def static_files(path: str):
    full = os.path.join(BASE_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(BASE_DIR, path)
    return "Not Found", 404

# ---------------- API ----------------
@app.post("/api/register")
def api_register():
    """
    Espera form-data ou JSON:
    { nome, username (opcional), cpf, senha (opcional), auto_pwd: 'on'|'off' }
    """
    data = request.get_json(silent=True) or request.form

    nome = (data.get("nome") or "").strip()
    username = (data.get("username") or "").strip()
    cpf = (data.get("cpf") or "").strip()
    senha = data.get("senha") or ""
    auto_pwd = (data.get("auto_pwd") == "on") or (str(data.get("auto_pwd")).lower() == "true")

    if not nome:
        return jsonify({"ok": False, "error": "Nome é obrigatório."}), 400
    if not CPF_RE.match(cpf):
        return jsonify({"ok": False, "error": "CPF deve ter 11 dígitos numéricos."}), 400

    users = load_users()

    if not username:
        username = generate_unique_username(users, nome)
    elif not USERNAME_RE.match(username):
        return jsonify({"ok": False, "error": "Nome de usuário inválido."}), 400

    if find_user_by_username(users, username):
        return jsonify({"ok": False, "error": "Nome de usuário já existe."}), 409
    if find_user_by_cpf(users, cpf):
        return jsonify({"ok": False, "error": "CPF já cadastrado."}), 409

    if auto_pwd or not senha:
        senha = generate_password(10)

    user = {
        "nome": nome,
        "username": username,
        "cpf": cpf,
        "password_hash": generate_password_hash(senha),
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    users.append(user)
    save_users(users)

    # Gera o conteúdo do .txt e grava cópia local
    txt_content = make_txt_content(nome, username, cpf, senha)
    filename = f"{username}_credenciais.txt"
    with open(os.path.join(DOWNLOADS_DIR, filename), "w", encoding="utf-8") as f:
        f.write(txt_content)

    # Retorna dados + txt para o front disparar o download
    return jsonify({
        "ok": True,
        "user": {"nome": nome, "username": username, "cpf": cpf},
        "senha": senha,
        "txt_filename": filename,
        "txt_content": txt_content
    }), 200

@app.post("/api/login")
def api_login():
    data = request.get_json(silent=True) or request.form
    ident = (data.get("ident") or "").strip()
    senha = data.get("senha") or ""

    users = load_users()
    user = find_user_by_cpf(users, ident) if CPF_RE.match(ident) else find_user_by_username(users, ident)

    if not user:
        return jsonify({"ok": False, "error": "Usuário/CPF não encontrado."}), 404
    if not check_password_hash(user["password_hash"], senha):
        return jsonify({"ok": False, "error": "Senha incorreta."}), 401

    session["username"] = user["username"]
    return jsonify({"ok": True, "user": {"username": user["username"], "nome": user["nome"], "cpf": user["cpf"]}}), 200

# download de txt (recria sem senha em texto — o cadastro já forneceu o txt com senha)
@app.get("/api/download/<username>")
def api_download(username: str):
    users = load_users()
    user = find_user_by_username(users, username)
    if not user:
        return jsonify({"ok": False, "error": "Usuário não encontrado."}), 404
    txt_content = make_txt_content(user["nome"], user["username"], user["cpf"], "(sua senha)")
    return send_file(BytesIO(txt_content.encode("utf-8")),
                     mimetype="text/plain; charset=utf-8",
                     as_attachment=True,
                     download_name=f"{username}_credenciais.txt")

if __name__ == "__main__":
    print("Servidor iniciado em http://127.0.0.1:5000 ...")
    app.run(debug=True)
