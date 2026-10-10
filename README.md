# Raízes do Nordeste: API Back-End

API REST da rede de restaurantes **Raízes do Nordeste**, desenvolvida para o Projeto Multidisciplinar (Trilha Back-End) da UNINTER.

Fluxo crítico entregue de ponta a ponta: **Pedido → Pagamento (mock) → Atualização de status**, com pedidos multicanal, estoque por unidade, fidelidade com consentimento (LGPD), autenticação JWT com perfis e trilha de auditoria.

- **Autor:** Kaylan de Mattos Izaac · RU 4636648
- **Disciplina:** Projeto Multidisciplinar, Trilha Back-End (Prof. Me. Luciane Yanase Kanashiro)

## Evidências e links

| Item                                         | Onde                                                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Repositório                                  | https://github.com/kaylanms/raizes-do-nordeste-api                                                                   |
| Swagger (local)                              | http://localhost:3000/docs                                                                                           |
| Contrato OpenAPI (JSON)                      | http://localhost:3000/docs-json · cópia em [`docs/openapi.json`](docs/openapi.json)                                  |
| Coleção Postman                              | [`docs/postman/raizes-do-nordeste.postman_collection.json`](docs/postman/raizes-do-nordeste.postman_collection.json) |
| Resultado da execução dos testes             | [`docs/evidencias/`](docs/evidencias/)                                                                               |
| DER                                          | [`docs/diagramas/der.png`](docs/diagramas/der.png) · detalhes em [`docs/der.md`](docs/der.md)                        |
| Diagramas (casos de uso, classes, sequência) | [`docs/diagramas/`](docs/diagramas/)                                                                                 |
| Requisitos e regras de negócio               | [`docs/requisitos.md`](docs/requisitos.md)                                                                           |
| Casos de uso                                 | [`docs/casos-de-uso.md`](docs/casos-de-uso.md)                                                                       |
| Plano de testes (T01 a T59)                  | [`docs/plano-de-testes.md`](docs/plano-de-testes.md)                                                                 |
| Deploy                                       | Não aplicável (execução local)                                                                                       |

## Stack

| Camada              | Tecnologia              |
| ------------------- | ----------------------- |
| Linguagem / runtime | TypeScript, Node.js 20+ |
| Framework           | NestJS                  |
| Banco de dados      | PostgreSQL 16 (Docker)  |
| ORM / migrations    | Prisma 6                |
| Autenticação        | JWT + bcrypt            |
| Documentação        | Swagger / OpenAPI       |
| Testes              | Postman + Newman        |

## Requisitos

- **Node.js 20 ou superior** e npm
- **Docker** com Docker Compose (no Windows, Docker Desktop)
- **Git**
- Porta **3000** (API) e **5433** (banco) livres. Se a 5433 estiver ocupada, veja a seção _Problemas comuns_.

## Como executar (passo a passo)

Os comandos abaixo funcionam no **PowerShell, no Terminal do Mac/Linux e no Git Bash**. Onde há diferença, os dois formatos estão indicados.

### 1. Clonar e instalar as dependências

```bash
git clone https://github.com/kaylanms/raizes-do-nordeste-api
cd raizes-do-nordeste-api
npm install
```

### 2. Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env              # Mac/Linux/Git Bash
Copy-Item .env.example .env       # Windows PowerShell
```

**Os valores do `.env.example` já funcionam em ambiente local; basta copiar o arquivo.** Para referência:

| Variável                                            | Descrição                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciais do banco criado pelo Docker                                         |
| `POSTGRES_PORT`                                     | Porta do banco no seu computador (use 5433)                                     |
| `DATABASE_URL`                                      | URL de conexão; deve usar **a mesma senha e a mesma porta** acima               |
| `PORT`                                              | Porta da API (padrão 3000)                                                      |
| `JWT_SECRET`                                        | Segredo do token. Em uso real, gere um valor longo e aleatório (comando abaixo) |
| `JWT_EXPIRES_IN`                                    | Validade do token em segundos (padrão 3600)                                     |

Opcional, para gerar um `JWT_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> **Importante:** o arquivo `.env` nunca vai para o Git. Só o `.env.example` é versionado.

### 3. Subir o banco de dados

```bash
docker compose up -d
docker compose ps          # o serviço "db" deve aparecer como "healthy"
```

### 4. Criar as tabelas (migrations) e carregar os dados de teste (seed)

```bash
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

O seed cria 3 unidades, 6 produtos, cardápio e estoque por unidade, 1 promoção e 6 usuários de teste. Ao final, deve aparecer "Seed concluído com sucesso."

### 5. Iniciar a API

```bash
npm run start:dev
```

Saída esperada:

```
API:     http://localhost:3000
Swagger: http://localhost:3000/docs
```

Para executar a versão compilada: `npm run build` e depois `npm run start:prod`.

Para conferir que está no ar: abra http://localhost:3000/health (deve mostrar `{"status":"ok", ...}`).

### 6. Acessar a documentação

Abra **http://localhost:3000/docs**. Para testar rotas protegidas:

1. Execute `POST /auth/login` com um dos usuários abaixo;
2. Copie o `accessToken` da resposta;
3. Clique em **Authorize** e cole **apenas o token** (sem a palavra "Bearer").

## Usuários de teste

Senha de todos: `Senha@123` (somente para ambiente de teste).

| Perfil    | E-mail               | Observação                      |
| --------- | -------------------- | ------------------------------- |
| ADMIN     | admin@raizes.com     | Acesso total                    |
| GERENTE   | gerente@raizes.com   | Vinculado à Matriz              |
| ATENDENTE | atendente@raizes.com | Vinculado à Matriz              |
| COZINHA   | cozinha@raizes.com   | Vinculado à Matriz              |
| CLIENTE   | maria@exemplo.com    | Com consentimento de fidelidade |
| CLIENTE   | joao@exemplo.com     | Sem consentimento de fidelidade |

Dados de teste úteis: a _Macaxeira Frita_ tem **1 unidade** em estoque na Matriz (para testar o 409), e a unidade de Salvador **não vende Bolo de Rolo** (para testar o 404). A promoção `BEMVINDO10` dá 10% de desconto.

## Como rodar os testes

A coleção Postman cobre 59 cenários (34 positivos e 25 negativos). Plano completo em [`docs/plano-de-testes.md`](docs/plano-de-testes.md).

**Pelo Postman**

1. Suba o banco e a API (passos 3 a 5).
2. Importe `docs/postman/raizes-do-nordeste.postman_collection.json`.
3. Use _Run collection_ **na ordem das pastas** (00 a 09). Tokens e IDs são guardados automaticamente em variáveis da coleção. O endereço da API está na variável `baseUrl` (padrão `http://localhost:3000`).

**Pela linha de comando (Newman)**, com a API rodando em outro terminal:

```bash
npm run test:api
```

O resultado também é gravado em `docs/evidencias/newman-resultado.json`. Esperado: nenhuma falha.

**Para partir de um banco limpo** (por exemplo, depois de uma execução interrompida): pare a API, execute `npm run db:reset` (recria as tabelas e roda o seed) e inicie a API de novo.

## Arquitetura

Estrutura modular, com quatro camadas dentro de cada módulo:

```
src/
├── modules/
│   └── <recurso>/            auth, usuarios, unidades, produtos, estoque,
│       ├── domain/           pedidos, pagamentos, fidelidade, auditoria
│       ├── application/
│       ├── infrastructure/
│       └── api/
├── shared/                   errors, guards, audit, pagination, prisma
└── main.ts                   bootstrap, Swagger e request id
prisma/                       schema.prisma, migrations/, seed.ts
docs/                         diagramas, postman, plano de testes, requisitos
```

| Camada             | Responsabilidade                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Domain**         | Regras puras (máquina de estados do pedido, regras de pontos) e contratos (interface `PagamentoGateway`) |
| **Application**    | Casos de uso que orquestram o fluxo (`PedidosService`, `PagamentosService`, `FidelidadeService`...)      |
| **Infrastructure** | Repositórios Prisma, hash de senha, gateway de pagamento mock, auditoria                                 |
| **API**            | Controllers, DTOs com validação, guards de autenticação/perfil, Swagger e filtro global de erros         |

## Endpoints principais

| Recurso      | Rotas                                                                                                                 | Permissão                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Autenticação | `POST /auth/login`                                                                                                    | Público                      |
| Usuários     | `POST /usuarios` · `GET /usuarios/me` · `DELETE /usuarios/me` (anonimiza)                                             | Público / autenticado        |
| Unidades     | `GET /unidades` · `POST /unidades`                                                                                    | Autenticado / ADMIN          |
| Produtos     | `GET /produtos` · `GET /produtos/{id}` · `POST` · `PATCH` · `DELETE`                                                  | Autenticado / ADMIN, GERENTE |
| Cardápio     | `GET /unidades/{id}/cardapio` · `PUT /unidades/{id}/cardapio/{produtoId}`                                             | Autenticado / ADMIN, GERENTE |
| Estoque      | `POST /estoque/movimentos` · `GET /estoque?unidadeId=`                                                                | ADMIN, GERENTE (da unidade)  |
| Pedidos      | `POST /pedidos` · `GET /pedidos?canalPedido=&status=&unidadeId=` · `GET /pedidos/{id}` · `PATCH /pedidos/{id}/status` | Conforme perfil              |
| Pagamentos   | `POST /pagamentos` · `GET /pagamentos/{id}`                                                                           | Conforme perfil              |
| Fidelidade   | `POST/DELETE /fidelidade/consentimento` · `GET /fidelidade/saldo` · `GET /fidelidade/historico`                       | CLIENTE                      |
| Auditoria    | `GET /auditoria`                                                                                                      | ADMIN, GERENTE               |
| Saúde        | `GET /health`                                                                                                         | Público                      |

Detalhes, exemplos de request/response e códigos de status estão no Swagger.

### Exemplo: criar pedido (multicanal)

```http
POST /pedidos
Authorization: Bearer <token>
Idempotency-Key: pedido-001        (opcional)

{
  "canalPedido": "TOTEM",
  "unidadeId": 1,
  "itens": [ { "produtoId": 1, "quantidade": 2 } ],
  "formaPagamento": "MOCK"
}
```

- `canalPedido` é **obrigatório**: `APP`, `TOTEM`, `BALCAO`, `PICKUP` ou `WEB`. Ausente ou inválido retorna **422**.
- Filtro por canal: `GET /pedidos?canalPedido=TOTEM`.

## Regras de negócio principais

- **Estoque por unidade:** o pedido só é criado se **todos** os itens têm estoque. A baixa é atômica e na mesma transação. Sem estoque, retorna **409** e nada é gravado.
- **Status do pedido:** `AGUARDANDO_PAGAMENTO → PAGO → EM_PREPARO → PRONTO → ENTREGUE`; cancelamento só enquanto aguarda pagamento. Transições inválidas retornam **409**; perfil sem permissão, **403**.
- **Pagamento mock** (`POST /pagamentos`): aprovado (pedido `PAGO`), recusado (pedido `CANCELADO`, estoque e pontos devolvidos) ou gateway indisponível (**503**, pedido preservado para nova tentativa). Para forçar o resultado em testes, envie `"simulacao": "APROVAR" | "RECUSAR" | "INDISPONIVEL"`.
- **Idempotência:** repetir a mesma `Idempotency-Key` em `POST /pedidos` ou `POST /pagamentos` devolve o resultado original (**200**), sem duplicar.
- **Fidelidade:** 1 ponto a cada R$ 1,00 pago; 1 ponto = R$ 0,10 de desconto; **somente com consentimento ativo**.
- **Promoção:** informe `codigoPromocao` no pedido (por exemplo, `BEMVINDO10`).

## Padrão de erro

Toda falha retorna o mesmo JSON:

```json
{
  "error": "ESTOQUE_INSUFICIENTE",
  "message": "Não há quantidade suficiente para um ou mais itens.",
  "details": [{ "field": "itens[0].quantidade", "issue": "Disponível: 1" }],
  "timestamp": "2026-10-09T12:00:00.000Z",
  "path": "/pedidos",
  "requestId": "uuid"
}
```

## Segurança e LGPD

- Senhas armazenadas apenas como **hash bcrypt**; o hash nunca é devolvido.
- **JWT** com expiração; guard global exige token (rotas públicas são marcadas explicitamente).
- **Autorização por perfil** e por unidade; o cliente só enxerga os próprios pedidos.
- **Minimização:** coleta apenas nome, e-mail e senha (sem CPF, telefone ou endereço).
- **Consentimento** do programa de fidelidade registrado com finalidade, base legal, versão do termo e datas; revogável.
- **Anonimização:** `DELETE /usuarios/me` remove os dados pessoais e mantém o histórico de pedidos sem identificar a pessoa.
- **Auditoria** de ações sensíveis (login, pedido, status, pagamento, consentimento) consultável em `GET /auditoria`.
- Erros inesperados retornam 500 genérico, sem detalhes internos.
- **Segredos:** o `.env` não é versionado; os valores do `.env.example` são apenas de exemplo para uso local.

## Decisões e limitações

Implementado: autenticação e perfis, unidades, produtos e cardápio por unidade, estoque, pedidos multicanal, pagamento mock, atualização de status, fidelidade com consentimento, aplicação de promoção e auditoria.

Fica como **proposta** (fora do MVP): cadastro de promoções e de usuários da equipe via API, refresh token e logout, limitação de taxa (rate limit) e deploy. Pagamento real está fora de escopo, conforme o roteiro.

## Problemas comuns

| Sintoma                                                    | Causa provável                                                                                                                | Solução                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `P1000` / "Authentication failed" ao rodar o seed ou a API | A senha do `.env` é diferente da usada ao criar o volume do Docker, ou outro PostgreSQL local está respondendo na mesma porta | Pare a API, rode `docker compose down -v`, confira `POSTGRES_PASSWORD`, `POSTGRES_PORT` e `DATABASE_URL` no `.env` e suba de novo   |
| Porta 5432 ocupada                                         | Outro PostgreSQL local                                                                                                        | No `.env`, troque `POSTGRES_PORT` e a porta dentro de `DATABASE_URL` (por exemplo, para 5433) e rode `docker compose up -d` de novo |
| `Cannot find module '@prisma/client'`                      | Client não gerado                                                                                                             | `npx prisma generate`                                                                                                               |
| 401 em todas as rotas no Swagger                           | Token não informado                                                                                                           | Faça login e use **Authorize** com o token puro                                                                                     |
| Avisos amarelos sobre `package.json#prisma`                | Aviso de depreciação do Prisma 7                                                                                              | Podem ser ignorados; não afetam a execução                                                                                          |
| Testes do Newman falhando no meio                          | Execução anterior interrompida (consentimento ativo)                                                                          | Pare a API, `npm run db:reset`, inicie a API de novo                                                                                |
| `relation "..." does not exist`                            | Migrations não aplicadas                                                                                                      | `npx prisma migrate deploy`                                                                                                         |
