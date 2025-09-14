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

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); msg.hidden = true;
      try {
        const formData = new FormData(form);
        // Primeiro verifica se o servidor está online
        try {
          const testRes = await fetch('http://127.0.0.1:5000/api/test');
          if (!testRes.ok) {
            throw new Error('Servidor não está respondendo');
          }
        } catch (error) {
          throw new Error('Erro: Servidor não está rodando. Execute: python config_itens.py');
        }

        const res = await fetch('http://127.0.0.1:5000/api/login', { 
          method: 'POST', 
          body: formData,
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        if (!res.ok || !data.ok) { showMsg(data.error || 'Falha no login.', false); return; }
        showMsg('Login realizado com sucesso!', true);
        document.dispatchEvent(new CustomEvent('login:ok'));
      } catch (err) {
        console.error(err); showMsg('Erro de comunicação com o servidor.', false);
      }
    });
  }
})();
// APP_CHALLENGE/cadastrado.js
