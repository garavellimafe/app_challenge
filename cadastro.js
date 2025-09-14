// APP_CHALLENGE/cadastro.js
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // Toggle mostrar/ocultar senha
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.password-toggle');
    if (!btn) return;
    const target = $(btn.getAttribute('data-target'));
    if (!target) return;
    const isPwd = target.type === 'password';
    target.type = isPwd ? 'text' : 'password';
    btn.textContent = isPwd ? 'Ocultar' : 'Mostrar';
    try { const v = target.value; target.focus({ preventScroll: true }); target.setSelectionRange(v.length, v.length); } catch (_) {}
  });

  // Checkbox gerar senha automaticamente => desabilita input
  const chk = $('#autoPwd');
  const pwd = $('#pwd-register');
  const syncPwd = () => {
    if (!chk || !pwd) return;
    if (chk.checked) {
      pwd.value = '';
      pwd.disabled = true;
      pwd.placeholder = 'Senha será gerada automaticamente';
    } else {
      pwd.disabled = false;
      pwd.placeholder = 'Deixe em branco para gerar automaticamente';
    }
  };
  if (chk) { chk.addEventListener('change', syncPwd); syncPwd(); }

  const form = $('#form-cadastro');
  const msg = $('#msg');
  const showMsg = (text, ok) => { msg.hidden=false; msg.textContent=text; msg.className='msg '+(ok?'ok':'error'); };

  // Valida nome (pelo menos 2 caracteres, apenas letras e espaços)
  const validateName = (name) => {
    return name.length === 0 || name.trim().length >= 2;
  };

  // Valida formato do CPF (apenas dígitos)
  const validateCPF = (cpf) => {
    return /^\d{11}$/.test(cpf);
  };

  // Valida formato do email
  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  // Valida formato do username (letras, números e underscore)
  const validateUsername = (username) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  if (form) {
    // Validação em tempo real do nome
    const nameInput = form.querySelector('input[name="nome"]');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value && !validateName(value)) {
          nameInput.setCustomValidity('Nome deve ter pelo menos 2 caracteres');
        } else {
          nameInput.setCustomValidity('');
        }
      });
    }

    // Validação em tempo real do e-mail
    const emailInput = form.querySelector('input[name="email"]');
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && !validateEmail(value)) {
          emailInput.setCustomValidity('Digite um e-mail válido');
        } else {
          emailInput.setCustomValidity('');
        }
      });
    }

    // Validação em tempo real do CPF
    const cpfInput = form.querySelector('input[name="cpf"]');
    if (cpfInput) {
      cpfInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/\D/g, '');
        e.target.value = value.slice(0, 11);
        
        if (value.length === 11) {
          if (!validateCPF(value)) {
            cpfInput.setCustomValidity('CPF deve conter exatamente 11 dígitos numéricos');
          } else {
            cpfInput.setCustomValidity('');
          }
        } else {
          cpfInput.setCustomValidity('');
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      msg.hidden = true;

      try {
        // Validate all required fields
        const nome = form.querySelector('input[name="nome"]').value.trim();
        const email = form.querySelector('input[name="email"]').value.trim();
        const cpf = form.querySelector('input[name="cpf"]').value.trim();
        const username = form.querySelector('input[name="username"]').value.trim();
        let senha = form.querySelector('input[name="senha"]').value;
        
        // Generate random password if auto-generate is checked or password is empty
        if (chk.checked || !senha) {
          senha = Math.random().toString(36).slice(-8);
        }
        
        if (!nome || !email || !cpf || !senha) {
          showMsg('Por favor, preencha todos os campos obrigatórios.', false);
          return;
        }
        
        // Disable form while submitting
        form.querySelectorAll('button, input').forEach(el => el.disabled = true);
        showMsg('Enviando...', true);
        
        const formData = {
          nome,
          email,
          cpf,
          senha,
          ...(username && { username })
        };
        console.log('Sending form data:', formData);
        
        const res = await fetch('http://127.0.0.1:5000/api/cadastro', { 
          method: 'POST', 
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const data = await res.json();

        if (!res.ok || !data.ok) { 
          showMsg(data.error || 'Erro ao cadastrar.', false); 
          return; 
        }

        // Baixa o .txt retornado
        const blob = new Blob([data.txt_content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.txt_filename || `${data.user.username}_credenciais.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { 
          URL.revokeObjectURL(url);
          a.remove();
        }, 0);

        // Guarda credenciais para a próxima tela (opcional)
        sessionStorage.setItem('last_user', JSON.stringify({
          nome: data.user.nome,
          username: data.user.username,
          cpf: data.user.cpf,
          senha: data.senha
        }));
        
        // Vai para a tela de login (cadastrado)
        showMsg('Cadastro realizado com sucesso!', true);
        setTimeout(() => {
          window.location.href = 'cadastrado.html';
        }, 2000);

      } catch (err) {
        console.error('Error during registration:', err);
        if (err.response) {
          console.error('Server response:', err.response);
          showMsg(err.response.error || 'Falha de comunicação com o servidor.', false);
        } else {
          showMsg('Falha de comunicação com o servidor.', false);
        }
      } finally {
        // Re-enable form
        form.querySelectorAll('button, input').forEach(el => el.disabled = false);
      }
    });
  }
})();
// APP_CHALLENGE/cadastro.js