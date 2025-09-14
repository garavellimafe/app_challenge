document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cadastro');
    const msgDiv = document.getElementById('msg');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    // Função para redirecionar após validação
    function redirecionarParaConfigItens(username) {
        localStorage.setItem('username', username);
        window.location.href = 'config_itens.html';
    }

    // Função para validar CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        return /^\d{11}$/.test(cpf);
    }

    // Função para validar telefone
    function validarTelefone(telefone) {
        telefone = telefone.replace(/\D/g, '');
        return /^\d{10,11}$/.test(telefone);
    }

    // Função para validar email
    function validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Função para mostrar mensagem
    function mostrarMensagem(texto, tipo) {
        msgDiv.textContent = texto;
        msgDiv.className = `msg ${tipo}`;
        msgDiv.hidden = false;
    }

    // Toggle de visibilidade da senha
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const target = document.querySelector(toggle.dataset.target);
            if (target.type === 'password') {
                target.type = 'text';
                toggle.textContent = 'Ocultar';
            } else {
                target.type = 'password';
                toggle.textContent = 'Mostrar';
            }
        });
    });

    // Manipulador do envio do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtém os valores dos campos
        const nome = form.nome.value.trim();
        const username = form.username.value.trim();
        const email = form.email.value.trim();
        const cpf = form.cpf.value.trim();
        const telefone = form.telefone.value.trim();
        const senha = form.senha.value;
        const confirmarSenha = form.confirmar_senha.value;

        // Validações
        if (nome.length < 2) {
            mostrarMensagem('Nome deve ter pelo menos 2 caracteres', 'error');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            mostrarMensagem('Nome de usuário deve ter entre 3 e 20 caracteres', 'error');
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensagem('E-mail inválido', 'error');
            return;
        }

        if (!validarCPF(cpf)) {
            mostrarMensagem('CPF inválido. Digite 11 números', 'error');
            return;
        }

        if (!validarTelefone(telefone)) {
            mostrarMensagem('Telefone inválido. Digite entre 10 e 11 números', 'error');
            return;
        }

        if (senha.length < 6) {
            mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        if (senha !== confirmarSenha) {
            mostrarMensagem('As senhas não coincidem', 'error');
            return;
        }

        try {
            // Mostra mensagem de sucesso
            mostrarMensagem('Cadastro realizado com sucesso!', 'ok');
            
            // Redireciona imediatamente
            redirecionarParaConfigItens(username);

        } catch (error) {
            console.error('Erro detalhado:', error);
            mostrarMensagem('Erro ao realizar cadastro. Tente novamente.', 'error');
        }
    });
});