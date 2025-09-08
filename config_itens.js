document.addEventListener("DOMContentLoaded", function () {
    // --------- ELEMENTOS PRINCIPAIS ---------
    const modal = document.getElementById("interfaceModal");
    const botaoAdicionar = document.getElementById("botaoAdicionar");
    const fecharModal = document.getElementById("fecharModal");
    const gridSelecionados = document.getElementById("gridSelecionados");
    const btnLimpar = document.getElementById("btnLimpar");
    const campoPesquisa = document.getElementById("campoPesquisa");

    // --------- MAPA DE CATEGORIAS ---------
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

    // --------- FUNÇÕES DE MODAL ---------
    function mostrarLista(id) {
        esconderTodasAsListas();
        const lista = document.getElementById(id);
        if (lista) lista.style.display = "grid";
    }

    function esconderTodasAsListas() {
        Object.values(categorias).forEach(id => {
            const lista = document.getElementById(id);
            if (lista) lista.style.display = "none";
        });
    }

    // Abrir modal (padrão: Residenciais)
    if (botaoAdicionar && modal) {
        botaoAdicionar.addEventListener("click", () => {
            modal.style.display = "flex";
            mostrarLista("listaResidenciais");
        });
    }

    // Fechar modal no botão "Adicionar"
    if (fecharModal && modal) {
        fecharModal.addEventListener("click", () => {
            modal.style.display = "none";
            esconderTodasAsListas();
        });
    }

    // Fechar modal clicando fora do conteúdo
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            esconderTodasAsListas();
        }
    });

    // Alternar listas pelas categorias
    Object.entries(categorias).forEach(([btnId, listaId]) => {
        const botao = document.getElementById(btnId);
        if (botao) {
            botao.addEventListener("click", () => mostrarLista(listaId));
        }
    });

    // --------- ITENS SELECIONADOS ---------
    function jaSelecionado(nome) {
        return Array.from(gridSelecionados.querySelectorAll(".item_selecionado"))
            .some(div => div.textContent.trim().toLowerCase() === nome.trim().toLowerCase());
    }

    function adicionarItemSelecionado(nomeItem) {
        if (!nomeItem) return;
        if (jaSelecionado(nomeItem)) return; // evita duplicados

        const novoItem = document.createElement("div");
        novoItem.classList.add("item_selecionado");
        novoItem.textContent = nomeItem;
        // dica de UX: remover ao clicar
        novoItem.title = "Clique para remover";
        gridSelecionados.appendChild(novoItem);
    }

    // Delegação de evento: clicar em qualquer item das listas adicionáveis
    Object.values(categorias).forEach(listaId => {
        const lista = document.getElementById(listaId);
        if (!lista) return;
        lista.addEventListener("click", (e) => {
            const item = e.target.closest(".item_adicionavel1");
            if (!item) return;
            const nome = item.textContent.trim();
            adicionarItemSelecionado(nome);
            modal.style.display = "none";
            esconderTodasAsListas();
        });
    });

    // Remover item selecionado ao clicar nele
    if (gridSelecionados) {
        gridSelecionados.addEventListener("click", (e) => {
            const item = e.target.closest(".item_selecionado");
            if (item) item.remove();
        });
    }

    // Limpar todos os itens selecionados
    if (btnLimpar && gridSelecionados) {
        btnLimpar.addEventListener("click", () => {
            gridSelecionados.innerHTML = "";
            if (campoPesquisa) campoPesquisa.value = "";
        });
    }

    // --------- BUSCA NOS ITENS SELECIONADOS ---------
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

    // --------- CHAT / ASSISTENTE VIRTUAL ---------
    const chatModal = document.getElementById("chatModal");
    const chatClose = document.getElementById("chatClose");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatBody = document.getElementById("chatBody");

    // Abrir o chat ao clicar em "Assistente Virtual"
    document.querySelectorAll(".cabecalho_item").forEach(item => {
        if (item.textContent.trim().toLowerCase() === "assistente virtual") {
            item.addEventListener("click", () => {
                if (chatModal) chatModal.style.display = "flex";
                if (chatBody && chatBody.innerHTML.trim() === "") {
                    chatBody.innerHTML = '<div class="msg-ia">Olá! Sou seu assistente virtual. Como posso ajudar?</div>';
                }
            });
        }
    });

    // Fechar o chat
    if (chatClose && chatModal) {
        chatClose.addEventListener("click", () => {
            chatModal.style.display = "none";
        });
    }

    // Enviar mensagem no chat
    function enviarMensagem() {
        if (!chatInput || !chatBody) return;

        const msg = chatInput.value.trim();
        if (!msg) return;

        // adiciona mensagem do usuário
        chatBody.innerHTML += `<div class="msg-usuario">${msg}</div>`;
        chatInput.value = "";
        chatBody.scrollTop = chatBody.scrollHeight;

        // indicador de carregamento
        const loadingId = "loading-" + Date.now();
        chatBody.innerHTML += `<div class="msg-ia" id="${loadingId}">Digitando...</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;

        // Chamada ao backend
        fetch("http://localhost:3080/api/assistente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagem: msg })
        })
        .then(async (r) => {
            let data;
            try {
                data = await r.json();
            } catch {
                data = { resposta: "[Resposta inválida do servidor]" };
            }
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            chatBody.innerHTML += `<div class="msg-ia">${(data && data.resposta) ? data.resposta : "[Sem resposta]"}</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        })
        .catch(() => {
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            chatBody.innerHTML += `<div class="msg-ia">[Erro de conexão com o assistente]</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    if (chatSend) chatSend.addEventListener("click", enviarMensagem);
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") enviarMensagem();
        });
    }
});
