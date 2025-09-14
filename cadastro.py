import os
import json
import re
import secrets
import string
import unicodedata
from datetime import datetime
from flask import jsonify, send_file
from werkzeug.security import generate_password_hash
from io import BytesIO

def register_user(data, users, base_dir):
    """Handle user registration logic"""
    nome = (data.get("nome") or "").strip()
    username = (data.get("username") or "").strip()
    cpf = (data.get("cpf") or "").strip()
    senha = data.get("senha") or ""
    auto_pwd = (data.get("auto_pwd") == "on") or (str(data.get("auto_pwd")).lower() == "true")

    if not nome:
        return jsonify({"ok": False, "error": "Nome é obrigatório."}), 400
    
    cpf_re = re.compile(r"^\d{11}$")
    if not cpf_re.match(cpf):
        return jsonify({"ok": False, "error": "CPF deve ter 11 dígitos numéricos."}), 400

    if not username:
        username = generate_unique_username(users, nome)
    elif not re.compile(r"^[a-zA-Z0-9_.-]{3,20}$").match(username):
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

    # Generate credentials file content
    txt_content = make_txt_content(nome, username, cpf, senha)
    filename = f"{username}_credenciais.txt"
    downloads_dir = os.path.join(base_dir, "downloads")
    os.makedirs(downloads_dir, exist_ok=True)
    
    with open(os.path.join(downloads_dir, filename), "w", encoding="utf-8") as f:
        f.write(txt_content)

    return jsonify({
        "ok": True,
        "user": {"nome": nome, "username": username, "cpf": cpf},
        "senha": senha,
        "txt_filename": filename,
        "txt_content": txt_content
    }), 200

def slugify_username_from_name(nome: str) -> str:
    """Convert name to a valid username"""
    nfkd = unicodedata.normalize("NFKD", nome)
    base = "".join(ch for ch in nfkd if not unicodedata.combining(ch))
    base = re.sub(r"[^a-zA-Z0-9]+", "", base).lower()
    if not base:
        base = "user"
    return base[:12]

def generate_unique_username(users, nome: str) -> str:
    """Generate a unique username based on the user's name"""
    base = slugify_username_from_name(nome)
    candidate, i = base, 1
    while any(u["username"].lower() == candidate.lower() for u in users):
        suffix = str(i)
        candidate = (base[:(16 - len(suffix))] + suffix)[:16]
        i += 1
    return candidate

def generate_password(length: int = 10) -> str:
    """Generate a secure random password"""
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
    """Generate the content for the credentials text file"""
    largura = 60
    titulo = f"Registro de {username}"
    sub = "GOODWE"
    linha = "=" * largura
    separador = "-" * largura
    senha_mostrar = senha if False else "********"  # SHOW_PASSWORD_IN_TXT is set to False
    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    def center(t: str) -> str:
        return t.center(largura)

    corpo = [
        linha,
        center(titulo),
        center(sub),
        linha,
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
        linha,
        ""
    ]
    return "\n".join(corpo)

def find_user_by_username(users, username):
    """Find a user by their username"""
    return next(
        (u for u in users if u["username"].lower() == username.lower()),
        None
    )

def find_user_by_cpf(users, cpf):
    """Find a user by their CPF"""
    return next(
        (u for u in users if u["cpf"] == cpf),
        None
    )
