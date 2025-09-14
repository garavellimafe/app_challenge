// APP_CHALLENGE/cadastrado.js
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const form = $('#form-login');
  const msg = $('#msg');

  // Ler e apagar após o uso
  const raw = sessionStorage.getItem('last_user');
  if (raw) {
    const last = JSON.parse(raw);
    // usar last.senha / last.username
    const ident = document.querySelector('#login-ident');
    const pwd = document.querySelector('#pwd-login');
    if (ident) ident.value = last.username || last.cpf || '';
    if (pwd) pwd.value = last.senha || '';
    // APAGAR DEPOIS DE USAR
    sessionStorage.removeItem('last_user');
  }

  // Toggle mostrar/ocultar senha
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.password-toggle');
    if (!btn) return;
    const input = $(btn.getAttribute('data-target'));
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    btn.textContent = isPwd ? 'Ocultar' : 'Mostrar';
  });

  const showMsg = (text, ok) => {
    msg.hidden = false;
    msg.textContent = text;
    msg.className = 'msg ' + (ok ? 'ok' : 'error');
  };

  // Valida entrada do usuário (CPF ou username)
  const validateIdentInput = (value) => {
    value = value.trim();
    // Se for apenas números e tiver 11 dígitos, é CPF
    if (/^\d{11}$/.test(value)) {
      return true;
    }
    // Se for username (3-20 caracteres, letras, números e underscore)
    if (/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      return true;
    }
    return false;
  };

  if (form) {
    // Validação em tempo real do campo de identificação
    const identInput = form.querySelector('#login-ident');
    const pwdInput = form.querySelector('#pwd-login');

    if (identInput) {
      identInput.setAttribute('pattern', '(\\d{11}|[a-zA-Z0-9_]{3,20})');
      identInput.setAttribute('title', 'Digite um CPF (11 dígitos) ou nome de usuário válido (3-20 caracteres)');
      identInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && !validateIdentInput(value)) {
          identInput.setCustomValidity('Digite um CPF (11 dígitos) ou nome de usuário válido (3-20 caracteres)');
        } else {
          identInput.setCustomValidity('');
        }
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault(); 
      msg.hidden = true;
      
      // Validar entrada antes de redirecionar
      const ident = identInput.value.trim();
      if (!validateIdentInput(ident)) {
        showMsg('Digite um CPF (11 dígitos) ou nome de usuário válido', false);
        return;
      }
      
      if (!pwdInput.value) {
        showMsg('Digite sua senha', false);
        return;
      }
      
      // Se passou pelas validações, mostra mensagem de sucesso e redireciona
      showMsg('Login realizado com sucesso!', true);
      
      // Salva o identificador no localStorage (caso precise depois)
      localStorage.setItem('userIdent', ident);
      
      // Redireciona imediatamente
      window.location.href = 'config_itens.html';
    });
  }
})();
