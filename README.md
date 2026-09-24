
## Aluno

**Raul pereira de castro**

## Descrição

A pedidos hub é uma aplicação web para cadastro e gerenciamento de produtos. O sistema permite cadastrar, visualizar, editar, excluir, pesquisar, filtrar e ordenar produtos, além de calcular automaticamente a quantidade e o valor total do estoque.

O projeto foi desenvolvido com HTML, CSS, JavaScript e jQuery. Os dados são armazenados no `localStorage` do navegador e permanecem disponíveis após atualizar ou fechar a página.

## Funcionalidades

- Cadastro de produtos com código, nome, categoria, preço e quantidade;
- listagem dos produtos em tabela;
- edição e exclusão com confirmação;
- validação dos campos e código único;
- pesquisa por código ou nome;
- filtro por categoria;
- ordenação por nome, preço, estoque ou data de cadastro;
- cálculo do valor em estoque de cada produto;
- cálculo da quantidade e do valor total do estoque;
- identificação visual de produtos com estoque baixo ou zerado;
- armazenamento dos produtos e logs no `localStorage`;
- mensagens de sucesso e erro;
- modo claro e modo escuro;
- interface responsiva para computador, tablet e celular;
- tela de logs com data, ação, descrição e recurso jQuery utilizado.

## Tecnologias utilizadas

- HTML5;
- CSS3;
- JavaScript;
- jQuery 3.7.1;
- Web Storage API (`localStorage`).

## Estrutura do projeto

```text
gerenciador-produtos/
├── css/
│   └── style.css
├── img/
│   ├── cadastro-produto.png
│   ├── tela-inicial.png
│   └── tela-logs.png
├── js/
│   ├── jquery-3.7.1.min.js
│   └── script.js
├── index.html
└── README.md
```

## Como executar

1. Baixe ou clone este repositório.
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` em um navegador moderno.

Não é necessário instalar dependências nem executar servidor. A biblioteca jQuery já está incluída na pasta `js`.

## Como os dados são armazenados

Os produtos ficam em um array de objetos JavaScript. Sempre que ocorre um cadastro, edição ou exclusão, o array atualizado é convertido para JSON e armazenado no `localStorage`.

```javascript
localStorage.setItem("stockflow_produtos", JSON.stringify(produtos));
```

Ao iniciar a aplicação, os dados são recuperados:

```javascript
const dados = localStorage.getItem("stockflow_produtos");
const produtos = dados ? JSON.parse(dados) : produtosIniciais;
```

## Utilização do jQuery

O jQuery é utilizado de forma efetiva em todo o sistema:

- seleção de elementos com `$()`;
- eventos com `.on()`;
- leitura e alteração de campos com `.val()`;
- alteração de conteúdo com `.text()` e `.html()`;
- manipulação de classes com `.addClass()`, `.removeClass()` e `.toggleClass()`;
- alteração de atributos com `.attr()` e `.removeAttr()`;
- exibição e ocultação com `.show()`, `.hide()`, `.toggle()`, `.fadeIn()` e `.fadeOut()`;
- criação e remoção de elementos com `.append()` e `.remove()`;
- delegação de eventos para elementos dinâmicos.

A tela **Logs do sistema** também identifica os principais comandos ou recursos usados em cada interação.

## Regras de negócio

1. O código do produto é obrigatório e não pode se repetir.
2. Nome e categoria são obrigatórios.
3. O preço deve ser maior que zero.
4. A quantidade deve ser um número inteiro igual ou maior que zero.
5. O valor de cada produto no estoque é calculado por `preço × quantidade`.
6. O valor total é a soma do valor em estoque de todos os produtos.
7. A exclusão exige confirmação do usuário.
8. Produtos com até cinco unidades são classificados como estoque baixo.

## Imagens da aplicação

### Tela inicial

![Tela inicial do StockFlow](img/tela-inicial.png)

### Cadastro de produto

![Formulário de cadastro](img/cadastro-produto.png)

### Logs do sistema

![Tela de logs](img/tela-logs.png)

## Sugestão para apresentação

Durante a apresentação, demonstre este fluxo:

1. cadastre um produto;
2. mostre a atualização automática dos cards e da tabela;
3. pesquise e filtre os registros;
4. edite o produto cadastrado;
5. abra a tela de logs e explique o uso do jQuery;
6. atualize a página para demonstrar o `localStorage`;
7. exclua o produto e confirme a atualização do estoque.
