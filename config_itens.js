document.addEventListener("DOMContentLoaded", function () {
    // Elementos principais
    const modal = document.getElementById("interfaceModal");
    const botaoAdicionar = document.getElementById("botaoAdicionar");
    const fecharModal = document.getElementById("fecharModal");
    const gridSelecionados = document.getElementById("gridSelecionados");
    const btnLimpar = document.getElementById("btnLimpar");

    // Botões de categoria e IDs das listas correspondentes
    const categorias = {
        btnResidenciais: "listaResidenciais",
        btnCI: "listaCI",
        btnBaterias: "listaBaterias",
        btnMonitoramento: "listaMonitoramento",
        btnVeicular: "listaVeicular",
        btnBIPV: "listaBIPV",
        btnSolo: "listaSolo",
        btnArmazenamento: "listaArmazenamento"
    };

    // Abrir modal e mostrar lista Residenciais por padrão
    if (botaoAdicionar && modal) {
        botaoAdicionar.addEventListener("click", () => {
            modal.style.display = "flex";
            mostrarLista("listaResidenciais");
        });
    }

    // Fechar modal
    if (fecharModal && modal) {
        fecharModal.addEventListener("click", () => {
            modal.style.display = "none";
            esconderTodasAsListas();
        });
    }

    // Mostrar lista específica
    function mostrarLista(id) {
        esconderTodasAsListas();
        const lista = document.getElementById(id);
        if (lista) lista.style.display = "grid";
    }

    // Esconder todas as listas
    function esconderTodasAsListas() {
        Object.values(categorias).forEach(id => {
            const lista = document.getElementById(id);
            if (lista) lista.style.display = "none";
        });
    }

    // Adicionar item à área de seleção
    function adicionarItemSelecionado(nomeItem) {
        const novoItem = document.createElement("div");
        novoItem.classList.add("item_selecionado");
        novoItem.textContent = nomeItem;
        gridSelecionados.appendChild(novoItem);
    }

    // Detectar clique em qualquer item adicionável
    Object.values(categorias).forEach(listaId => {
        const lista = document.getElementById(listaId);
        if (lista) {
            lista.querySelectorAll(".item_adicionavel1").forEach(item => {
                item.addEventListener("click", () => {
                    const nome = item.textContent.trim();
                    adicionarItemSelecionado(nome);
                    modal.style.display = "none"; // Fecha o modal ao selecionar
                    esconderTodasAsListas();      // Limpa visualmente as listas
                });
            });
        }
    });

    // Adicionar eventos aos botões de categoria
    Object.entries(categorias).forEach(([btnId, listaId]) => {
        const botao = document.getElementById(btnId);
        if (botao) {
            botao.addEventListener("click", () => {
                mostrarLista(listaId);
            });
        }
    });

    // Limpar todos os itens selecionados
    if (btnLimpar && gridSelecionados) {
        btnLimpar.addEventListener("click", () => {
            gridSelecionados.innerHTML = "";
        });
    }
});

const campoPesquisa = document.getElementById("campoPesquisa");

if (campoPesquisa && gridSelecionados) {
    campoPesquisa.addEventListener("input", () => {
        const termo = campoPesquisa.value.toLowerCase();
        const itens = gridSelecionados.querySelectorAll(".item_selecionado");

        itens.forEach(item => {
            const texto = item.textContent.toLowerCase();
            item.style.display = texto.includes(termo) ? "block" : "none";
        });
    });
}
// ...Código original acima...

// --- Assistente Virtual (chat) ---
document.addEventListener("DOMContentLoaded", function () {
    const chatModal = document.getElementById("chatModal");
    const chatClose = document.getElementById("chatClose");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatBody = document.getElementById("chatBody");

    // Abrir chat ao clicar em "Assistente Virtual"
    document.querySelectorAll('.cabecalho_item').forEach(item => {
        if (item.textContent.trim().toLowerCase() === 'assistente virtual') {
            item.addEventListener('click', () => {
                chatModal.style.display = "flex";
                chatBody.innerHTML = '<div class="msg-ia">Olá! Sou seu assistente virtual. Como posso ajudar?</div>';
            });
        }
    });

    // Fechar chat
    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatModal.style.display = "none";
        });
    }

    // Enviar mensagem
    function enviarMensagem() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        chatBody.innerHTML += `<div class="msg-usuario">${msg}</div>`;
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Chama backend
        fetch('http://localhost:3080/api/assistente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: msg })
        })
        .then(r => r.json())
        .then(data => {
            chatBody.innerHTML += `<div class="msg-ia">${data.resposta}</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        })
        .catch(() => {
            chatBody.innerHTML += `<div class="msg-ia">[Erro de conexão com o assistente]</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    if (chatSend) chatSend.addEventListener('click', enviarMensagem);
    if (chatInput) chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') enviarMensagem();
    });
});
