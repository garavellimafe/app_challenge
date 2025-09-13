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

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); msg.hidden = true;

      try {
        const res = await fetch('/api/register', { method: 'POST', body: new FormData(form) });
        const data = await res.json();
        if (!res.ok || !data.ok) { showMsg(data.error || 'Erro ao cadastrar.', false); return; }

        // Baixa o .txt retornado
        const blob = new Blob([data.txt_content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = data.txt_filename || `${data.user.username}_credenciais.txt`;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);

        // Guarda credenciais para a próxima tela (opcional)
        sessionStorage.setItem('last_user', JSON.stringify({
          nome: data.user.nome, username: data.user.username, cpf: data.user.cpf, senha: data.senha
        }));
        
        // Vai para a tela de login (cadastrado), conforme pedido
        window.location.href = 'cadastrado.html';
      } catch (err) {
        console.error(err); showMsg('Falha de comunicação com o servidor.', false);
      }
    });
  }
})();
// APP_CHALLENGE/cadastro.js