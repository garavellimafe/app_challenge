from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash", generation_config={
        "temperature": 0.7,
        "max_output_tokens": 500,
    })
    print("✅ Modelo da Gemini carregado com sucesso.")
except Exception as e:
    print(f"❌ Erro ao configurar a API da Gemini: {e}")
    model = None

app = Flask(__name__)
CORS(app)

@app.route("/api/assistente", methods=["POST"])
def assistente():
    if not model:
        return jsonify({"erro": "Modelo de IA não foi inicializado corretamente."}), 500

    try:
        dados = request.get_json()
        mensagem_usuario = dados.get("mensagem")
        itens_atuais = dados.get("itens", [])
        itens_disponiveis = dados.get("itens_disponiveis", [])

        if not mensagem_usuario:
            return jsonify({"erro": "Nenhuma mensagem fornecida."}), 400

        print(f"📨 Mensagem recebida: {mensagem_usuario}")
        print(f"📋 Itens atuais: {itens_atuais}")

        acoes = []
        mensagem_lower = mensagem_usuario.lower()
        
        print(f"🔍 Analisando mensagem: '{mensagem_lower}'")
        print(f"📦 Produtos disponíveis: {len(itens_disponiveis)} itens")
        
        if any(palavra in mensagem_lower for palavra in ["adicionar", "adicione", "add", "colocar", "incluir", "quero", "preciso"]):
            print("🔍 Detectou palavra de adição")
            produto_encontrado = None
            melhor_match = 0
            
            for produto in itens_disponiveis:
                produto_words = produto.lower().split()
                matches = 0
                
                for word in produto_words:
                    if word in mensagem_lower:
                        matches += 1
                
                if matches > 0 and matches >= melhor_match:
                    palavras_importantes = [w for w in produto_words if len(w) > 2]
                    if any(palavra in mensagem_lower for palavra in palavras_importantes):
                        produto_encontrado = produto
                        melhor_match = matches
                        print(f"🎯 Match encontrado: {produto} (score: {matches})")
            
            if produto_encontrado:
                acoes.append({
                    "funcao": "adicionar_item",
                    "argumentos": {
                        "nome": produto_encontrado,
                        "ativo": True,
                        "prioridade": "prioritário" in mensagem_lower or "importante" in mensagem_lower
                    }
                })
                print(f"➕ Ação de adição detectada para: {produto_encontrado}")
            else:
                print("❌ Nenhum produto específico encontrado na mensagem")
                palavras_chave = ["dns", "xs", "ms", "sdt", "lynx", "inversor", "bateria"]
                produtos_sugeridos = []
                for palavra in palavras_chave:
                    if palavra in mensagem_lower:
                        produtos_sugeridos.extend([p for p in itens_disponiveis if palavra in p.lower()])
                
                if produtos_sugeridos and len(produtos_sugeridos) > 0:
                    produto_encontrado = produtos_sugeridos[0]
                    acoes.append({
                        "funcao": "adicionar_item",
                        "argumentos": {
                            "nome": produto_encontrado,
                            "ativo": True,
                            "prioridade": "prioritário" in mensagem_lower or "importante" in mensagem_lower
                        }
                    })
                    print(f"💡 Produto sugerido adicionado: {produto_encontrado}")
        
        print(f"📊 Total de ações detectadas: {len(acoes)}")

        if acoes:
            acao = acoes[0]
            if acao['funcao'] == 'adicionar_item':
                prompt = f"""
                Você é um assistente da GoodWe que ACABOU DE ADICIONAR um produto.
                
                PRODUTO ADICIONADO: {acao['argumentos']['nome']}
                STATUS: Ativo={acao['argumentos']['ativo']}, Prioritário={acao['argumentos']['prioridade']}
                
                Confirme brevemente que adicionou o produto especificando o nome completo.
                Seja natural e amigável.
                
                Mensagem do usuário: "{mensagem_usuario}"
                """
        else:
            prompt = f"""
            Você é um assistente amigável da GoodWe para sistemas de energia solar.
            
            CONTEXTO ATUAL:
            Itens configurados: {json.dumps(itens_atuais, indent=2) if itens_atuais else "Nenhum item configurado"}
            
            PRODUTOS DISPONÍVEIS PARA ADICIONAR:
            {json.dumps(itens_disponiveis[:15], indent=2) if itens_disponiveis else "Lista não disponível"}

            INSTRUÇÕES:
            - Responda de forma útil e amigável em português
            - Se o usuário pedir para adicionar um produto, seja específico sobre qual produto da lista disponível
            - Se não entender qual produto específico, pergunte para esclarecer
            
            Mensagem do usuário: "{mensagem_usuario}"
            """

        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(prompt)
        
        resposta_texto = response.text
        
        resposta_final = {
            "resposta": resposta_texto,
            "acoes": acoes
        }
        
        print(f"✅ Resposta enviada com {len(acoes)} ação(ões)")
        if acoes:
            print(f"🎯 Ações: {[acao['funcao'] for acao in acoes]}")
        
        return jsonify(resposta_final)

    except Exception as e:
        print(f"❌ Erro no endpoint /api/assistente: {e}")
        return jsonify({"erro": f"Erro interno do servidor: {str(e)}"}), 500

@app.route('/')
def index():
    return send_from_directory('.', 'config_itens.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

if __name__ == "__main__":
    print("🚀 Iniciando servidor Flask com IA do Gemini...")
    print("🌐 Servidor disponível em: http://localhost:3080")
    print("💬 Chat em: http://localhost:3080/api/assistente")
    print("=" * 50)
    
    try:
        app.run(host="0.0.0.0", port=3080, debug=True)
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        print("🔍 Verifique se a porta 3080 não está sendo usada por outro processo.")