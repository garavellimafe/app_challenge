from flask import jsonify, session
from werkzeug.security import check_password_hash

def login_user(users, data):
    """Handle user login logic"""
    ident = (data.get("ident") or "").strip()
    senha = data.get("senha") or ""

    user = next(
        (u for u in users if u["cpf"] == ident or u["username"].lower() == ident.lower()),
        None
    )

    if not user:
        return jsonify({"ok": False, "error": "Usuário/CPF não encontrado."}), 404
    if not check_password_hash(user["password_hash"], senha):
        return jsonify({"ok": False, "error": "Senha incorreta."}), 401

    session["username"] = user["username"]
    return jsonify({
        "ok": True,
        "user": {
            "username": user["username"],
            "nome": user["nome"],
            "cpf": user["cpf"]
        }
    }), 200
