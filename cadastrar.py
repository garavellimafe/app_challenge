from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import logging
from datetime import datetime

# Configuração do logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Configura CORS para todas as rotas

# Caminho absoluto para o arquivo JSON
USUARIOS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'usuarios.json')

# Certificar que o arquivo usuarios.json existe
def inicializar_arquivo():
    try:
        if not os.path.exists(USUARIOS_FILE):
            os.makedirs(os.path.dirname(USUARIOS_FILE), exist_ok=True)
            with open(USUARIOS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False)
            logger.debug(f'Arquivo {USUARIOS_FILE} criado com sucesso')
    except Exception as e:
        logger.error(f'Erro ao inicializar arquivo: {e}')
        raise

# Carregar usuários existentes
def carregar_usuarios():
    try:
        if not os.path.exists(USUARIOS_FILE):
            logger.debug('Arquivo não existe, retornando lista vazia')
            return []
        with open(USUARIOS_FILE, 'r', encoding='utf-8') as f:
            usuarios = json.load(f)
            logger.debug(f'Carregados {len(usuarios)} usuários')
            return usuarios
    except Exception as e:
        logger.error(f'Erro ao carregar usuários: {e}')
        return []

# Salvar lista atualizada de usuários
def salvar_usuarios(usuarios):
    try:
        with open(USUARIOS_FILE, 'w', encoding='utf-8') as f:
            json.dump(usuarios, f, indent=4, ensure_ascii=False)
        logger.debug(f'Salvos {len(usuarios)} usuários')
    except Exception as e:
        logger.error(f'Erro ao salvar usuários: {e}')
        raise

@app.route('/salvar_cadastro', methods=['POST'])
def salvar_cadastro():
    try:
        logger.debug('Recebendo requisição de cadastro')
        
        # Inicializar arquivo se não existir
        inicializar_arquivo()
        
        # Receber dados do formulário
        dados = request.get_json()
        logger.debug(f'Dados recebidos: {dados}')
        
        if not dados:
            logger.error('Nenhum dado recebido')
            return jsonify({'erro': 'Dados não recebidos'}), 400
        
        # Validar campos obrigatórios
        campos_obrigatorios = ['nome', 'username', 'email', 'cpf', 'telefone', 'senha']
        for campo in campos_obrigatorios:
            if campo not in dados:
                logger.error(f'Campo obrigatório ausente: {campo}')
                return jsonify({'erro': f'Campo {campo} é obrigatório'}), 400
        
        # Adicionar data de cadastro
        dados['data_cadastro'] = datetime.now().isoformat()
        
        # Carregar usuários existentes
        usuarios = carregar_usuarios()
        
        # Verificar se username ou email já existem
        for usuario in usuarios:
            if usuario['username'] == dados['username']:
                logger.warning(f'Username já existe: {dados["username"]}')
                return jsonify({'erro': 'Nome de usuário já existe'}), 400
            if usuario['email'] == dados['email']:
                logger.warning(f'Email já existe: {dados["email"]}')
                return jsonify({'erro': 'E-mail já cadastrado'}), 400
        
        # Adicionar novo usuário
        usuarios.append(dados)
        
        # Salvar lista atualizada
        salvar_usuarios(usuarios)
        logger.info('Cadastro realizado com sucesso')
        
        return jsonify({
            'mensagem': 'Cadastro realizado com sucesso',
            'redirect': 'config_itens.html'
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no servidor: {str(e)}")
        return jsonify({'erro': 'Erro interno do servidor: ' + str(e)}), 500

if __name__ == '__main__':
    # Garantir que o arquivo existe antes de iniciar o servidor
    inicializar_arquivo()
    logger.info(f'Servidor iniciado. Arquivo de usuários: {USUARIOS_FILE}')
    app.run(debug=True, host='127.0.0.1', port=5000)
