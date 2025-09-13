// APP_CHALLENGE/cadastrado.js
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const form = $('#form-login');
  const msg = $('#msg');

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
        const res = await fetch('/api/login', { method: 'POST', body: new FormData(form) });
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