document.addEventListener("DOMContentLoaded", function () {
    // ELEMENTOS PRINCIPAIS
    const modal = document.getElementById("interfaceModal");
    const botaoAdicionar = document.getElementById("botaoAdicionar");
    const fecharModal = document.getElementById("fecharModal");
    const gridSelecionados = document.getElementById("gridSelecionados");
    const btnLimpar = document.getElementById("btnLimpar");
    const campoPesquisa = document.getElementById("campoPesquisa");
    const btnExportar = document.getElementById("btnExportar");
    const btnImportar = document.getElementById("btnImportar");
    const inputImportar = document.getElementById("inputImportar");

    // MODAL DE NOMEAÇÃO
    const modalNomeacao = document.getElementById("modalNomeacao");
    const imagemPreview = document.getElementById("imagemPreview");
    const inputNomePersonalizado = document.getElementById("inputNomePersonalizado");
    const confirmarNomeacao = document.getElementById("confirmarNomeacao");
    const removerItemSelecionado = document.getElementById("removerItemSelecionado");
    const sliderAtivo = document.getElementById("sliderAtivo");
    const statusTexto = document.getElementById("statusTexto");
    const sliderPrioridade = document.getElementById("sliderPrioridade");
    const prioridadeTexto = document.getElementById("prioridadeTexto");
    const btnAssistenteNomeacao = document.getElementById("btnAssistenteNomeacao");
    const chatModal = document.getElementById("chatModal");
    const chatBody = document.getElementById("chatBody");

    let itemSelecionadoParaEdicao = null;
    let imagemSelecionadaTemp = null;
    let nomeOriginalTemp = "";

    // CATEGORIAS
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

    // ABRIR MODAL PRINCIPAL
    botaoAdicionar?.addEventListener("click", () => {
        modal.style.display = "flex";
        mostrarLista("listaResidenciais");
    });

    // FECHAR MODAL PRINCIPAL
    fecharModal?.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // MOSTRAR LISTA DE CATEGORIA
    Object.keys(categorias).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener("click", () => {
                mostrarLista(categorias[btnId]);
            });
        }
    });

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

    // ADICIONAR ITEM SELECIONADO
    function adicionarItemSelecionado(nomeItem, imagemSrc, ativo, prioridade = false) {
        const novoItem = document.createElement("div");
        novoItem.classList.add("item_selecionado");
        novoItem.setAttribute("data-ativo", String(ativo)); // Garante que seja string
        novoItem.setAttribute("data-prioridade", String(prioridade)); // Garante que seja string
        novoItem.title = "Clique para editar";

        if (imagemSrc) {
            const img = document.createElement("img");
            img.src = imagemSrc;
            img.alt = nomeItem;
            // Adiciona um listener de erro para não adicionar imagens quebradas
            img.onerror = function() {
                this.remove(); // Remove o elemento img se a imagem não carregar
            };
            novoItem.appendChild(img);
        }

        const contentDiv = document.createElement("div");
        contentDiv.className = "item_content";
        
        const texto = document.createElement("span");
        texto.textContent = nomeItem;
        contentDiv.appendChild(texto);
        novoItem.appendChild(contentDiv);

        const switchContainer = document.createElement("div");
        switchContainer.className = "switch_container";

        // Adiciona o slider de ativo em uma row
        const switchRowAtivo = document.createElement("div");
        switchRowAtivo.className = "switch_row";
        
        const labelSwitchAtivo = document.createElement("label");
        labelSwitchAtivo.className = "switch switch-inline";
        const inputSwitchAtivo = document.createElement("input");
        inputSwitchAtivo.type = "checkbox";
        inputSwitchAtivo.className = "switchAtivoGrid";
        inputSwitchAtivo.checked = ativo;
        inputSwitchAtivo.addEventListener("change", function(e) {
            novoItem.setAttribute("data-ativo", e.target.checked);
        });
        const spanSliderAtivo = document.createElement("span");
        spanSliderAtivo.className = "slider";
        labelSwitchAtivo.appendChild(inputSwitchAtivo);
        labelSwitchAtivo.appendChild(spanSliderAtivo);
        switchRowAtivo.appendChild(labelSwitchAtivo);

        const statusTexto = document.createElement("span");
        statusTexto.className = "statusTextoGrid";
        statusTexto.textContent = inputSwitchAtivo.checked ? "Ativado" : "Desativado";
        inputSwitchAtivo.addEventListener("change", function(e) {
            statusTexto.textContent = e.target.checked ? "Ativado" : "Desativado";
        });
        switchRowAtivo.appendChild(statusTexto);
        switchContainer.appendChild(switchRowAtivo);

        // Adiciona o slider de prioritário em uma nova row
        const switchRowPrioridade = document.createElement("div");
        switchRowPrioridade.className = "switch_row";
        
        const labelSwitchPrioridade = document.createElement("label");
        labelSwitchPrioridade.className = "switch switch-inline";
        const inputSwitchPrioridade = document.createElement("input");
        inputSwitchPrioridade.type = "checkbox";
        inputSwitchPrioridade.className = "switchPrioridadeGrid";
        inputSwitchPrioridade.checked = prioridade; // Usa o valor passado
        inputSwitchPrioridade.addEventListener("change", function(e) {
            novoItem.setAttribute("data-prioridade", e.target.checked);
        });
        const spanSliderPrioridade = document.createElement("span");
        spanSliderPrioridade.className = "slider";
        labelSwitchPrioridade.appendChild(inputSwitchPrioridade);
        labelSwitchPrioridade.appendChild(spanSliderPrioridade);
        switchRowPrioridade.appendChild(labelSwitchPrioridade);

        const prioridadeTexto = document.createElement("span");
        prioridadeTexto.className = "prioridadeTextoGrid";
        prioridadeTexto.textContent = inputSwitchPrioridade.checked ? "Prioritário" : "Normal";
        inputSwitchPrioridade.addEventListener("change", function(e) {
            prioridadeTexto.textContent = e.target.checked ? "Prioritário" : "Normal";
        });
        switchRowPrioridade.appendChild(prioridadeTexto);
        switchContainer.appendChild(switchRowPrioridade);

        novoItem.appendChild(switchContainer);
        gridSelecionados.appendChild(novoItem);
    }

    // CLIQUE EM ITEM ADICIONÁVEL
    document.querySelectorAll(".lista_adicionavel").forEach(lista => {
        lista.addEventListener("click", (e) => {
            const item = e.target.closest(".item_adicionavel1");
            if (!item) return;

            const span = item.querySelector("span");
            nomeOriginalTemp = span ? span.textContent.trim() : item.textContent.trim();

            const imgTag = item.querySelector("img");
            imagemSelecionadaTemp = imgTag ? imgTag.getAttribute("src") : null;

            sliderAtivo.checked = false;
            sliderPrioridade.checked = false;

            imagemPreview.src = imagemSelecionadaTemp || "";
            inputNomePersonalizado.value = nomeOriginalTemp;
            itemSelecionadoParaEdicao = null;

            modal.style.display = "none";
            modalNomeacao.style.display = "flex";
        });
    });

    // CLIQUE EM ITEM SELECIONADO
    gridSelecionados?.addEventListener("click", (e) => {
        const item = e.target.closest(".item_selecionado");
        if (!item) return;

        const span = item.querySelector("span");
        nomeOriginalTemp = span ? span.textContent.trim() : item.textContent.trim();

        const imgTag = item.querySelector("img");
        imagemSelecionadaTemp = imgTag ? imgTag.getAttribute("src") : null;

        const ativo = item.getAttribute("data-ativo") === "true";
        sliderAtivo.checked = ativo;

        const prioridade = item.getAttribute("data-prioridade") === "true";
        sliderPrioridade.checked = prioridade;

        imagemPreview.src = imagemSelecionadaTemp || "";
        inputNomePersonalizado.value = nomeOriginalTemp;
        itemSelecionadoParaEdicao = item;

        modalNomeacao.style.display = "flex";
    });

    // CONFIRMAR NOMEAÇÃO
    confirmarNomeacao?.addEventListener("click", () => {
        const nomeFinal = inputNomePersonalizado.value.trim();
        const ativo = sliderAtivo.checked;
        const prioridade = sliderPrioridade.checked;
        if (!nomeFinal) return;

        if (itemSelecionadoParaEdicao) {
            const span = itemSelecionadoParaEdicao.querySelector("span");
            if (span) span.textContent = nomeFinal;

            itemSelecionadoParaEdicao.setAttribute("data-ativo", ativo);
            itemSelecionadoParaEdicao.setAttribute("data-prioridade", prioridade);

            // Atualiza os sliders existentes ou adiciona novos
            let switchAtivo = itemSelecionadoParaEdicao.querySelector(".switchAtivoGrid");
            let statusTexto = itemSelecionadoParaEdicao.querySelector(".statusTextoGrid");
            let switchPrioridade = itemSelecionadoParaEdicao.querySelector(".switchPrioridadeGrid");
            let prioridadeTexto = itemSelecionadoParaEdicao.querySelector(".prioridadeTextoGrid");

            if (!switchAtivo) {
                // Adiciona o slider de ativo se não existir
                const labelSwitchAtivo = document.createElement("label");
                labelSwitchAtivo.className = "switch switch-inline";
                const inputSwitchAtivo = document.createElement("input");
                inputSwitchAtivo.type = "checkbox";
                inputSwitchAtivo.className = "switchAtivoGrid";
                inputSwitchAtivo.checked = ativo;
                const spanSliderAtivo = document.createElement("span");
                spanSliderAtivo.className = "slider";
                labelSwitchAtivo.appendChild(inputSwitchAtivo);
                labelSwitchAtivo.appendChild(spanSliderAtivo);
                itemSelecionadoParaEdicao.appendChild(labelSwitchAtivo);

                statusTexto = document.createElement("span");
                statusTexto.className = "statusTextoGrid";
                itemSelecionadoParaEdicao.appendChild(statusTexto);
            } else {
                switchAtivo.checked = ativo;
            }

            if (!switchPrioridade) {
                // Adiciona o slider de prioridade se não existir
                const labelSwitchPrioridade = document.createElement("label");
                labelSwitchPrioridade.className = "switch switch-inline";
                const inputSwitchPrioridade = document.createElement("input");
                inputSwitchPrioridade.type = "checkbox";
                inputSwitchPrioridade.className = "switchPrioridadeGrid";
                inputSwitchPrioridade.checked = prioridade;
                const spanSliderPrioridade = document.createElement("span");
                spanSliderPrioridade.className = "slider";
                labelSwitchPrioridade.appendChild(inputSwitchPrioridade);
                labelSwitchPrioridade.appendChild(spanSliderPrioridade);
                itemSelecionadoParaEdicao.appendChild(labelSwitchPrioridade);

                prioridadeTexto = document.createElement("span");
                prioridadeTexto.className = "prioridadeTextoGrid";
                itemSelecionadoParaEdicao.appendChild(prioridadeTexto);
            } else {
                switchPrioridade.checked = prioridade;
            }

            // Atualiza os textos
            statusTexto.textContent = ativo ? "Ativado" : "Desativado";
            prioridadeTexto.textContent = prioridade ? "Prioritário" : "Normal";

            itemSelecionadoParaEdicao = null;
        } else {
            adicionarItemSelecionado(nomeFinal, imagemSelecionadaTemp, ativo, prioridade);
        }
        modalNomeacao.style.display = "none";
    });

    // REMOVER ITEM
    removerItemSelecionado?.addEventListener("click", () => {
        if (itemSelecionadoParaEdicao) {
            itemSelecionadoParaEdicao.remove();
            itemSelecionadoParaEdicao = null;
        }
        modalNomeacao.style.display = "none";
    });

    // LIMPAR TODOS
    btnLimpar?.addEventListener("click", () => {
        gridSelecionados.innerHTML = "";
        campoPesquisa.value = "";
    });

    // BUSCA
    campoPesquisa?.addEventListener("input", () => {
        const termo = campoPesquisa.value.toLowerCase();
        const itens = gridSelecionados.querySelectorAll(".item_selecionado");
        itens.forEach(item => {
            const texto = item.textContent.toLowerCase();
            item.style.display = texto.includes(termo) ? "" : "none";
        });
    });

    // EXPORTAR ITENS SELECIONADOS EM JSON
    btnExportar?.addEventListener("click", () => {
        const itens = Array.from(gridSelecionados.querySelectorAll(".item_selecionado")).map(item => {
            const nome = item.querySelector("span")?.textContent || "";
            const img = item.querySelector("img")?.getAttribute("src") || null;
            const ativo = item.getAttribute("data-ativo") === "true";
            const prioridade = item.getAttribute("data-prioridade") === "true";
            return { nome, img, ativo, prioridade };
        });
        const blob = new Blob([JSON.stringify(itens, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "itens_selecionados.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // IMPORTAR ITENS SELECIONADOS DE JSON
    btnImportar?.addEventListener("click", () => {
        inputImportar.click();
    });

    inputImportar?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const itens = JSON.parse(evt.target.result);
                gridSelecionados.innerHTML = "";
                itens.forEach(item => {
                    const novoItem = document.createElement("div");
                    novoItem.classList.add("item_selecionado");
                    novoItem.setAttribute("data-ativo", item.ativo);
                    novoItem.setAttribute("data-prioridade", item.prioridade);
                    novoItem.title = "Clique para editar";
                    if (item.img) {
                        const img = document.createElement("img");
                        img.src = item.img;
                        img.alt = item.nome;
                        novoItem.appendChild(img);
                    }
                    const texto = document.createElement("span");
                    texto.textContent = item.nome;
                    novoItem.appendChild(texto);
                    gridSelecionados.appendChild(novoItem);
                });
            } catch (err) {
                alert("Arquivo JSON inválido ou formato incompatível.");
            }
        };
        reader.readAsText(file);
        inputImportar.value = "";
    });

    // FUNÇÃO PARA EXTRAIR ITENS DISPONÍVEIS DO MODAL
    function getItensDisponiveis() {
        const itens = [];
        document.querySelectorAll(".item_adicionavel1").forEach(item => {
            const span = item.querySelector("span");
            if (span && span.textContent.trim()) {
                itens.push(span.textContent.trim());
            }
        });
        return itens;
    }

    // FUNÇÕES DE MANIPULAÇÃO DE ITENS PARA IA
    function getItensAtuais() {
        return Array.from(gridSelecionados.querySelectorAll(".item_selecionado")).map(item => {
            return {
                nome: item.querySelector("span")?.textContent || "",
                ativo: item.getAttribute("data-ativo") === "true",
                prioridade: item.getAttribute("data-prioridade") === "true",
            };
        });
    }

    function removerItemPeloNome(nome) {
        const itemParaRemover = Array.from(gridSelecionados.querySelectorAll(".item_selecionado")).find(item => {
            const span = item.querySelector("span");
            return span && span.textContent.toLowerCase() === nome.toLowerCase();
        });
        if (itemParaRemover) {
            itemParaRemover.remove();
            console.log(`Item "${nome}" removido.`);
        } else {
            console.log(`Item "${nome}" não encontrado para remoção.`);
        }
    }

    function atualizarItemPeloNome(nomeOriginal, novoNome, ativo, prioridade) {
        const itemParaAtualizar = Array.from(gridSelecionados.querySelectorAll(".item_selecionado")).find(item => {
            const span = item.querySelector("span");
            return span && span.textContent.toLowerCase() === nomeOriginal.toLowerCase();
        });

        if (itemParaAtualizar) {
            if (novoNome) {
                const span = itemParaAtualizar.querySelector("span");
                if (span) span.textContent = novoNome;
            }
            if (ativo !== undefined) {
                itemParaAtualizar.setAttribute("data-ativo", ativo);
                const switchAtivo = itemParaAtualizar.querySelector(".switchAtivoGrid");
                const statusTexto = itemParaAtualizar.querySelector(".statusTextoGrid");
                if (switchAtivo) switchAtivo.checked = ativo;
                if (statusTexto) statusTexto.textContent = ativo ? "Ativado" : "Desativado";
            }
            if (prioridade !== undefined) {
                itemParaAtualizar.setAttribute("data-prioridade", prioridade);
                const switchPrioridade = itemParaAtualizar.querySelector(".switchPrioridadeGrid");
                const prioridadeTexto = itemParaAtualizar.querySelector(".prioridadeTextoGrid");
                if (switchPrioridade) switchPrioridade.checked = prioridade;
                if (prioridadeTexto) prioridadeTexto.textContent = prioridade ? "Prioritário" : "Normal";
            }
            console.log(`Item "${nomeOriginal}" atualizado.`);
        } else {
            console.log(`Item "${nomeOriginal}" não encontrado para atualização.`);
        }
    }

    function executarAcao(acao) {
        const { funcao, argumentos } = acao;
        console.log("Executando ação:", funcao, argumentos);

        switch (funcao) {
            case "adicionar_item":
                // Tenta encontrar a imagem correspondente na lista de itens disponíveis
                const itemOriginal = Array.from(document.querySelectorAll(".item_adicionavel1")).find(item => {
                    const span = item.querySelector("span");
                    return span && span.textContent.trim().toLowerCase() === argumentos.nome.toLowerCase();
                });
                const imagemSrc = itemOriginal ? itemOriginal.querySelector("img")?.src : null;

                adicionarItemSelecionado(argumentos.nome, imagemSrc, argumentos.ativo || false, argumentos.prioridade || false);
                break;
            case "remover_item":
                removerItemPeloNome(argumentos.nome);
                break;
            case "atualizar_item":
                atualizarItemPeloNome(argumentos.nome_original, argumentos.novo_nome, argumentos.ativo, argumentos.prioridade);
                break;
            default:
                console.warn(`Função desconhecida: ${funcao}`);
        }
    }

    // CHAT
    const chatClose = document.getElementById("chatClose");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");

    document.querySelectorAll(".cabecalho_item").forEach(item => {
        if (item.textContent.trim().toLowerCase() === "assistente virtual") {
            item.addEventListener("click", () => {
                chatModal.style.display = "flex";
                if (chatBody.innerHTML.trim() === "") {
                    chatBody.innerHTML = '<div class="msg-ia">Olá! Sou seu assistente virtual. Como posso ajudar?</div>';
                }
            });
        }
    });

    btnAssistenteNomeacao?.addEventListener("click", () => {
        chatModal.style.display = "flex";
        if (chatBody.innerHTML.trim() === "") {
            chatBody.innerHTML = '<div class="msg-ia">Olá! Sou seu assistente virtual. Como posso ajudar?</div>';
        }
    });

    chatClose?.addEventListener("click", () => {
        chatModal.style.display = "none";
    });

    function enviarMensagem() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        chatBody.innerHTML += `<div class="msg-usuario">${msg}</div>`;
        chatInput.value = "";
        chatBody.scrollTop = chatBody.scrollHeight;

        const loadingId = "loading-" + Date.now();
        chatBody.innerHTML += `<div class="msg-ia" id="${loadingId}">Digitando...</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;

        // Coleta os itens atuais e disponíveis para enviar como contexto para a IA
        const itensAtuais = getItensAtuais();
        const itensDisponiveis = getItensDisponiveis();

        fetch("http://localhost:3080/api/assistente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                mensagem: msg, 
                itens: itensAtuais,
                itens_disponiveis: itensDisponiveis 
            })
        })
        .then(async (r) => {
            if (!r.ok) {
                const err = await r.json();
                throw new Error(err.erro || "Erro na comunicação com a API.");
            }
            return r.json();
        })
        .then((data) => {
            const loadingDiv = document.getElementById(loadingId);
            
            // Exibe a resposta da IA
            if (data.resposta) {
                loadingDiv.innerHTML = data.resposta;
            } else {
                loadingDiv.remove();
            }

            chatBody.scrollTop = chatBody.scrollHeight;
        })
        .catch((err) => {
            const loadingDiv = document.getElementById(loadingId);
            if (loadingDiv) {
                loadingDiv.innerHTML = `Erro: ${err.message}`;
                loadingDiv.style.color = "red";
            }
        });
    }

    chatSend?.addEventListener("click", enviarMensagem);
    chatInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") enviarMensagem();
    });
});
