from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

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
        dados = request.get_json()
        mensagem_usuario = dados.get("mensagem")
        itens_atuais = dados.get("itens", []) # Recebe os itens do frontend

        if not mensagem_usuario:
            return jsonify({"erro": "Nenhuma mensagem fornecida."}), 400

        # Constrói o prompt para a IA, dando o contexto dos itens atuais
        itens_disponiveis = dados.get("itens_disponiveis", [])
        
        prompt = f"""
        Você é um assistente amigável de configuração de sistemas de energia solar da GoodWe.
        Você ajuda os usuários explicando como usar a interface, mas NÃO pode adicionar, remover ou modificar itens diretamente.
        
        A lista de itens atualmente configurados é: {json.dumps(itens_atuais, indent=2)}
        A lista de produtos disponíveis para adicionar é: {json.dumps(itens_disponiveis, indent=2)}

        Importante:
        1. Sempre explique ao usuário como realizar as ações manualmente:
           - Para adicionar: "Clique no botão '+ Adicionar Item', escolha a categoria apropriada e selecione o produto desejado"
           - Para configurar: "Clique no item que deseja configurar, ajuste as opções de Ativo/Prioritário e clique em Confirmar"
           - Para remover: "Clique no item, e então clique no botão 'Remover'"
        2. Informe que você não pode realizar as ações diretamente, apenas guiar o usuário.
        3. Se o usuário perguntar sobre um produto específico, sugira em qual categoria ele pode encontrá-lo.
        4. Se um item solicitado não existir na lista, informe educadamente.

        Com base na solicitação do usuário: "{mensagem_usuario}", forneça instruções claras e amigáveis sobre como proceder.
        """

        # Inicia uma sessão de chat com o histórico
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(prompt)
        
        resposta_final = {"resposta": "", "acoes": []}

        # Usa o texto gerado pela IA como resposta
        resposta_final["resposta"] = response.text
        resposta_final["acoes"] = []  # Sempre vazio, já que a IA não executa ações

        return jsonify(resposta_final)

    except Exception as e:
        print(f"Ocorreu um erro no endpoint /api/assistente: {e}")
        return jsonify({"erro": "Ocorreu um erro interno no servidor."}), 500

# Inicia o servidor Flask
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3080, debug=True)
