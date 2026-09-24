/*
 * StockFlow - Gerenciador de Produtos
 * Regras de negócio em JavaScript e manipulação da interface com jQuery.
 */

$(function () {
    "use strict";

    const CHAVE_PRODUTOS = "stockflow_produtos";
    const CHAVE_LOGS = "stockflow_logs";
    const CHAVE_TEMA = "stockflow_tema";

    const produtosIniciais = [
        { id: gerarId(), codigo: "PROD-001", nome: "Teclado Mecânico", categoria: "Periféricos", preco: 249.9, quantidade: 8, criadoEm: "2026-09-16T10:00:00.000Z" },
        { id: gerarId(), codigo: "PROD-002", nome: "Mouse sem fio", categoria: "Periféricos", preco: 89.9, quantidade: 14, criadoEm: "2026-09-17T10:00:00.000Z" },
        { id: gerarId(), codigo: "PROD-003", nome: "Monitor 24 polegadas", categoria: "Informática", preco: 899, quantidade: 4, criadoEm: "2026-09-18T10:00:00.000Z" },
        { id: gerarId(), codigo: "PROD-004", nome: "Caderno Executivo", categoria: "Escritório", preco: 32.5, quantidade: 20, criadoEm: "2026-09-19T10:00:00.000Z" },
        { id: gerarId(), codigo: "PROD-005", nome: "Hub USB-C", categoria: "Acessórios", preco: 159.9, quantidade: 0, criadoEm: "2026-09-20T10:00:00.000Z" }
    ];

    let produtos = carregarDados(CHAVE_PRODUTOS, produtosIniciais);
    let logs = carregarDados(CHAVE_LOGS, []);
    let produtoParaExcluir = null;
    let temporizadorPesquisa = null;

    iniciarAplicacao();

    function iniciarAplicacao() {
        aplicarTemaSalvo();
        atualizarCategorias();
        renderizarProdutos();
        atualizarResumo();
        renderizarLogs();

        if (logs.length === 0) {
            registrarLog("Sistema", "Aplicação iniciada e dados de demonstração carregados.", "$(document).ready(...) / $(function(){ ... })");
        }
    }

    // -------------------- Persistência --------------------

    function carregarDados(chave, valorPadrao) {
        try {
            const dados = localStorage.getItem(chave);
            return dados ? JSON.parse(dados) : [...valorPadrao];
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            return [...valorPadrao];
        }
    }

    function salvarProdutos() {
        localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    }

    function salvarLogs() {
        localStorage.setItem(CHAVE_LOGS, JSON.stringify(logs));
    }

    // -------------------- Eventos com jQuery --------------------

    $(".nav-item").on("click", function () {
        const pagina = $(this).data("page");
        $(".nav-item").removeClass("active").removeAttr("aria-current");
        $(this).addClass("active").attr("aria-current", "page");
        $(".page").removeClass("active").attr("hidden", true);
        $("#pagina" + capitalizar(pagina)).removeAttr("hidden").addClass("active");
        $("#tituloPagina").text(pagina === "produtos" ? "Produtos" : "Logs do sistema");
        $("#btnNovoProduto").toggle(pagina === "produtos");
        $(".sidebar").removeClass("open");

        if (pagina === "logs") renderizarLogs();
    });

    $("#btnMenu").on("click", function () {
        $(".sidebar").toggleClass("open");
    });

    $("#btnTema").on("click", function () {
        const escuro = !$("body").hasClass("dark");
        $("body").toggleClass("dark", escuro);
        $(this).attr("aria-pressed", escuro);
        $(".theme-icon").text(escuro ? "☀" : "☾");
        $(".theme-label").text(escuro ? "Modo claro" : "Modo escuro");
        localStorage.setItem(CHAVE_TEMA, escuro ? "escuro" : "claro");
        registrarLog("Sistema", `Tema alterado para o modo ${escuro ? "escuro" : "claro"}.`, "$('body').toggleClass('dark')");
    });

    $("#btnNovoProduto").on("click", function () {
        abrirModalProduto();
    });

    $(".fechar-modal").on("click", fecharModalProduto);

    $("#modalProduto").on("click", function (evento) {
        if (evento.target === this) fecharModalProduto();
    });

    $("#formProduto").on("submit", function (evento) {
        evento.preventDefault();
        salvarProduto();
    });

    $("#preco, #quantidade").on("input", atualizarPreviewEstoque);

    $("#campoPesquisa").on("input", function () {
        renderizarProdutos();
        clearTimeout(temporizadorPesquisa);
        const termo = $(this).val().trim();
        temporizadorPesquisa = setTimeout(function () {
            if (termo) registrarLog("Pesquisa", `Pesquisa realizada por “${termo}”.`, "$('#campoPesquisa').on('input', ...)");
        }, 700);
    });

    $("#filtroCategoria, #ordenacao").on("change", function () {
        renderizarProdutos();
        const rotulo = $(this).find("option:selected").text();
        registrarLog("Filtro", `Opção aplicada: ${rotulo}.`, "$('select').on('change', ...)");
    });

    $("#btnLimparFiltros").on("click", function () {
        $("#campoPesquisa").val("");
        $("#filtroCategoria").val("todas");
        $("#ordenacao").val("recentes");
        renderizarProdutos();
        registrarLog("Filtro", "Filtros e ordenação foram redefinidos.", "$('input, select').val(...)");
    });

    // Delegação de eventos para botões criados dinamicamente na tabela.
    $("#tabelaProdutos").on("click", ".btn-editar", function (evento) {
        evento.stopPropagation();
        fecharMenusAcoes();
        editarProduto($(this).data("id"));
    });

    $("#tabelaProdutos").on("click", ".btn-excluir", function (evento) {
        evento.stopPropagation();
        fecharMenusAcoes();
        solicitarExclusao($(this).data("id"));
    });

    $("#tabelaProdutos").on("click", ".table-menu-button", function (evento) {
        evento.stopPropagation();
        const $botao = $(this);
        const $menu = $botao.next(".action-popover");
        const estahAberto = $menu.is(":visible");
        fecharMenusAcoes();

        if (!estahAberto) {
            $menu.removeAttr("hidden").show();
            $botao.attr("aria-expanded", "true");
        }
    });

    $(document).on("click", function (evento) {
        if (!$(evento.target).closest(".action-menu").length) {
            fecharMenusAcoes();
        }
    });

    $(document).on("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharMenusAcoes();
        }
    });

    $("#btnCancelarExclusao").on("click", fecharConfirmacao);
    $("#btnConfirmarExclusao").on("click", excluirProduto);

    $("#pesquisaLogs, #filtroLog").on("input change", renderizarLogs);

    $("#btnLimparLogs").on("click", function () {
        if (logs.length === 0) {
            mostrarMensagem("Não há logs para limpar.", "erro");
            return;
        }
        if (window.confirm("Deseja realmente apagar todo o histórico de logs?")) {
            logs = [];
            salvarLogs();
            renderizarLogs();
            atualizarBadgeLogs();
            mostrarMensagem("Histórico de logs removido.", "sucesso");
        }
    });

    $(document).on("keydown", function (evento) {
        if (evento.key === "Escape") {
            fecharModalProduto();
            fecharConfirmacao();
        }
    });

    // -------------------- CRUD de produtos --------------------

    function salvarProduto() {
        limparErros();
        const id = $("#produtoId").val();
        const produto = {
            id: id || gerarId(),
            codigo: $("#codigo").val().trim().toUpperCase(),
            nome: $("#nome").val().trim(),
            categoria: $("#categoria").val(),
            preco: converterPreco($("#preco").val()),
            quantidade: $("#quantidade").val().trim() === "" ? NaN : Number($("#quantidade").val()),
            criadoEm: id ? produtos.find(item => item.id === id).criadoEm : new Date().toISOString()
        };

        const erros = validarProduto(produto, id);
        if (Object.keys(erros).length > 0) {
            exibirErros(erros);
            mostrarMensagem("Verifique os campos destacados.", "erro");
            return;
        }

        if (id) {
            const indice = produtos.findIndex(item => item.id === id);
            produtos[indice] = produto;
            registrarLog("Edição", `Produto ${produto.codigo} — ${produto.nome} atualizado.`, "$('#formProduto').on('submit', ...) + $.text()");
            mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
        } else {
            produtos.push(produto);
            registrarLog("Cadastro", `Produto ${produto.codigo} — ${produto.nome} cadastrado.`, "$('#formProduto').on('submit', ...) + $.val()");
            mostrarMensagem("Produto cadastrado com sucesso!", "sucesso");
        }

        salvarProdutos();
        atualizarCategorias();
        renderizarProdutos();
        atualizarResumo();
        fecharModalProduto();
    }

    function editarProduto(id) {
        const produto = produtos.find(item => item.id === id);
        if (!produto) return;

        $("#produtoId").val(produto.id);
        $("#codigo").val(produto.codigo);
        $("#nome").val(produto.nome);
        $("#categoria").val(produto.categoria);
        $("#preco").val(produto.preco.toFixed(2).replace(".", ","));
        $("#quantidade").val(produto.quantidade);
        $("#tituloModal").text("Editar produto");
        $("#btnSalvar").text("Salvar alterações");
        atualizarPreviewEstoque();
        abrirModalProduto(true);
    }

    function solicitarExclusao(id) {
        produtoParaExcluir = produtos.find(item => item.id === id);
        if (!produtoParaExcluir) return;
        $("#textoConfirmacao").text(`O produto “${produtoParaExcluir.nome}” será removido permanentemente.`);
        $("#modalConfirmacao").removeAttr("hidden").hide().fadeIn(180);
        $("#btnCancelarExclusao").trigger("focus");
    }

    function excluirProduto() {
        if (!produtoParaExcluir) return;
        const produtoExcluido = produtoParaExcluir;
        produtos = produtos.filter(item => item.id !== produtoExcluido.id);
        salvarProdutos();
        registrarLog("Exclusão", `Produto ${produtoExcluido.codigo} — ${produtoExcluido.nome} excluído.`, "Array.filter() + $('.btn-excluir').on('click', ...)");
        atualizarCategorias();
        renderizarProdutos();
        atualizarResumo();
        fecharConfirmacao();
        mostrarMensagem("Produto excluído com sucesso!", "sucesso");
    }

    function validarProduto(produto, idAtual) {
        const erros = {};
        if (!produto.codigo) erros.codigo = "Informe o código do produto.";
        if (!produto.nome) erros.nome = "Informe o nome do produto.";
        if (!produto.categoria) erros.categoria = "Selecione uma categoria.";
        if (!Number.isFinite(produto.preco) || produto.preco <= 0) erros.preco = "Informe um preço maior que zero.";
        if (!Number.isInteger(produto.quantidade) || produto.quantidade < 0) erros.quantidade = "Informe uma quantidade inteira igual ou maior que zero.";

        const codigoDuplicado = produtos.some(item => item.codigo.toLowerCase() === produto.codigo.toLowerCase() && item.id !== idAtual);
        if (codigoDuplicado) erros.codigo = "Este código já está sendo utilizado.";
        return erros;
    }

    // -------------------- Renderização --------------------

    function obterProdutosVisiveis() {
        const termo = $("#campoPesquisa").val().trim().toLowerCase();
        const categoria = $("#filtroCategoria").val();
        const ordenacao = $("#ordenacao").val();

        const filtrados = produtos.filter(produto => {
            const correspondeTermo = produto.nome.toLowerCase().includes(termo) || produto.codigo.toLowerCase().includes(termo);
            const correspondeCategoria = categoria === "todas" || produto.categoria === categoria;
            return correspondeTermo && correspondeCategoria;
        });

        return filtrados.sort((a, b) => {
            if (ordenacao === "nome-asc") return a.nome.localeCompare(b.nome, "pt-BR");
            if (ordenacao === "preco-asc") return a.preco - b.preco;
            if (ordenacao === "preco-desc") return b.preco - a.preco;
            if (ordenacao === "estoque-asc") return a.quantidade - b.quantidade;
            return new Date(b.criadoEm) - new Date(a.criadoEm);
        });
    }

    function renderizarProdutos() {
        const visiveis = obterProdutosVisiveis();
        const linhas = visiveis.map(produto => {
            const valorEstoque = produto.preco * produto.quantidade;
            const classeEstoque = produto.quantidade === 0 ? "empty" : produto.quantidade <= 5 ? "low" : "";
            const textoEstoque = produto.quantidade === 0 ? "Sem estoque" : `${produto.quantidade} un.`;

            return `
                <tr>
                    <td><span class="code">${escaparHtml(produto.codigo)}</span></td>
                    <td><div class="product-name">${escaparHtml(produto.nome)}</div></td>
                    <td><span class="category-tag">${escaparHtml(produto.categoria)}</span></td>
                    <td class="align-right">${formatarMoeda(produto.preco)}</td>
                    <td class="align-center"><span class="stock-tag ${classeEstoque}">${textoEstoque}</span></td>
                    <td class="align-right"><strong>${formatarMoeda(valorEstoque)}</strong></td>
                    <td>
                        <div class="action-menu">
                            <button class="table-menu-button" type="button" data-id="${produto.id}" aria-label="Abrir ações para ${escaparHtml(produto.nome)}" aria-expanded="false">⋯</button>
                            <div class="action-popover" role="menu" hidden>
                                <button class="popover-action btn-editar" type="button" data-id="${produto.id}" aria-label="Editar ${escaparHtml(produto.nome)}">Editar</button>
                                <button class="popover-action btn-excluir delete" type="button" data-id="${produto.id}" aria-label="Excluir ${escaparHtml(produto.nome)}">Excluir</button>
                            </div>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        $("#tabelaProdutos").html(linhas);
        $("#resultadoContador").text(`${visiveis.length} ${visiveis.length === 1 ? "resultado" : "resultados"}`);
        $("#estadoVazio").prop("hidden", visiveis.length > 0);
        $("table").toggle(visiveis.length > 0);
    }

    function atualizarResumo() {
        const totalItens = produtos.reduce((soma, produto) => soma + produto.quantidade, 0);
        const valorTotal = produtos.reduce((soma, produto) => soma + produto.preco * produto.quantidade, 0);
        const estoqueBaixo = produtos.filter(produto => produto.quantidade <= 5).length;

        $("#totalProdutos").text(produtos.length);
        $("#totalItens").text(totalItens.toLocaleString("pt-BR"));
        $("#valorTotalEstoque").text(formatarMoeda(valorTotal));
        $("#totalEstoqueBaixo").text(estoqueBaixo);
    }

    function atualizarCategorias() {
        const valorAtual = $("#filtroCategoria").val() || "todas";
        const categorias = [...new Set(produtos.map(produto => produto.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR"));
        const opcoes = categorias.map(categoria => `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`).join("");
        $("#filtroCategoria").html(`<option value="todas">Todas as categorias</option>${opcoes}`).val(valorAtual);
        if ($("#filtroCategoria").val() === null) $("#filtroCategoria").val("todas");
    }

    // -------------------- Logs --------------------

    function registrarLog(tipo, descricao, comandoJquery) {
        logs.unshift({ id: gerarId(), tipo, descricao, comandoJquery, data: new Date().toISOString() });
        logs = logs.slice(0, 150);
        salvarLogs();
        atualizarBadgeLogs();
        if ($("#paginaLogs").hasClass("active")) renderizarLogs();
    }

    function renderizarLogs() {
        const termo = $("#pesquisaLogs").val().trim().toLowerCase();
        const tipo = $("#filtroLog").val() || "todos";
        const filtrados = logs.filter(log => {
            const correspondeTermo = log.descricao.toLowerCase().includes(termo) || log.tipo.toLowerCase().includes(termo) || log.comandoJquery.toLowerCase().includes(termo);
            return correspondeTermo && (tipo === "todos" || log.tipo === tipo);
        });

        const itens = filtrados.map(log => `
            <article class="log-item">
                <time class="log-time" datetime="${log.data}">${formatarData(log.data)}</time>
                <span class="log-type ${normalizarClasse(log.tipo)}">${escaparHtml(log.tipo)}</span>
                <span class="log-description">${escaparHtml(log.descricao)}</span>
                <code class="log-command" title="${escaparHtml(log.comandoJquery)}">${escaparHtml(log.comandoJquery)}</code>
            </article>`).join("");

        $("#listaLogs").html(itens).toggle(filtrados.length > 0);
        $("#logsVazios").prop("hidden", filtrados.length > 0);
        atualizarBadgeLogs();
    }

    function atualizarBadgeLogs() {
        $("#logBadge").text(logs.length > 99 ? "99+" : logs.length);
    }

    // -------------------- Interface e utilitários --------------------

    function abrirModalProduto(manterDados = false) {
        if (!manterDados) {
            $("#formProduto").trigger("reset");
            $("#produtoId").val("");
            $("#tituloModal").text("Novo produto");
            $("#btnSalvar").text("Cadastrar produto");
            $("#previewValorEstoque").text("R$ 0,00");
            limparErros();
        }
        $("#modalProduto").removeAttr("hidden").hide().fadeIn(180);
        $("#codigo").trigger("focus");
    }

    function fecharModalProduto() {
        if ($("#modalProduto").is(":visible")) {
            $("#modalProduto").fadeOut(150, function () { $(this).attr("hidden", true); });
        }
    }

    function fecharConfirmacao() {
        produtoParaExcluir = null;
        if ($("#modalConfirmacao").is(":visible")) {
            $("#modalConfirmacao").fadeOut(150, function () { $(this).attr("hidden", true); });
        }
    }

    function fecharMenusAcoes() {
        $(".action-popover").hide().attr("hidden", true);
        $(".table-menu-button").attr("aria-expanded", "false");
    }

    function exibirErros(erros) {
        Object.entries(erros).forEach(([campo, mensagem]) => {
            const $campo = $("#" + campo);
            $campo.closest(".form-group").addClass("invalid");
            $(`[data-error-for="${campo}"]`).text(mensagem);
        });
        $("#" + Object.keys(erros)[0]).trigger("focus");
    }

    function limparErros() {
        $(".form-group").removeClass("invalid");
        $(".field-error").text("");
    }

    function mostrarMensagem(mensagem, tipo) {
        const titulo = tipo === "erro" ? "Não foi possível concluir" : "Operação concluída";
        const simbolo = tipo === "erro" ? "!" : "✓";
        const $toast = $(`<div class="toast ${tipo === "erro" ? "error" : ""}"><span class="toast-symbol">${simbolo}</span><div><strong>${titulo}</strong><p>${escaparHtml(mensagem)}</p></div></div>`);
        $("#toastContainer").append($toast);
        $toast.hide().fadeIn(180).delay(2800).fadeOut(260, function () { $(this).remove(); });
    }

    function atualizarPreviewEstoque() {
        const preco = converterPreco($("#preco").val());
        const quantidade = Number($("#quantidade").val());
        const total = Number.isFinite(preco) && Number.isFinite(quantidade) ? preco * quantidade : 0;
        $("#previewValorEstoque").text(formatarMoeda(total));
    }

    function aplicarTemaSalvo() {
        const escuro = localStorage.getItem(CHAVE_TEMA) === "escuro";
        $("body").toggleClass("dark", escuro);
        $("#btnTema").attr("aria-pressed", escuro);
        $(".theme-icon").text(escuro ? "☀" : "☾");
        $(".theme-label").text(escuro ? "Modo claro" : "Modo escuro");
    }

    function converterPreco(valor) {
        if (typeof valor === "number") return valor;
        const texto = String(valor).trim().replace(/\s/g, "");
        if (texto.includes(",")) return Number(texto.replace(/\./g, "").replace(",", "."));
        return Number(texto);
    }

    function formatarMoeda(valor) {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
    }

    function formatarData(dataIso) {
        return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(dataIso));
    }

    function gerarId() {
        return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function capitalizar(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function normalizarClasse(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function escaparHtml(texto) {
        return $("<div>").text(String(texto)).html();
    }
});
