# Plano de Testes da API: Raízes do Nordeste

Os cenários abaixo estão **todos implementados** na coleção `docs/postman/raizes-do-nordeste.postman_collection.json` (cada linha da coluna *Evidência* é o nome da requisição na coleção). Cada requisição traz scripts de teste que validam status e trechos do response.

**Totais:** 59 cenários, sendo 34 positivos e 25 negativos (mínimo exigido: 10, com 6 positivos e 4 negativos).

## Como executar

1. `docker compose up -d` e `npm run start:dev` (API em `http://localhost:3000`).
2. (Opcional, recomendado) `npm run db:reset` com a API parada, para partir de um banco limpo; depois suba a API.
3. No Postman: *Import* → arquivo da coleção → *Run collection*, mantendo a ordem das pastas (00 a 09).
4. Pela linha de comando: `npm run test:api` (Newman).
5. Tokens e IDs são guardados automaticamente em variáveis da coleção. Usuários e senha do seed: ver README.

## Cenários

| ID | Tipo | Cenário | Endpoint | Pré-condição | Entrada | Esperado (status + pontos do response) | Evidência (nome na coleção) |
|---|---|---|---|---|---|---|---|
| T01 | Positivo | API no ar (health check) | `GET /health` | sem token | — | 200 + status=ok | 00 Saúde / T01 - API no ar (health check) |
| T02 | Positivo | Login válido (CLIENTE) | `POST /auth/login` | sem token; usuário do seed | `{"email":"maria@exemplo.com","senha":"Senha@123"}` | 200 + accessToken (Bearer) + user.perfil=CLIENTE | 01 Auth / T02 - Login válido (CLIENTE) |
| T03 | Positivo | Perfil do usuário autenticado | `GET /usuarios/me` | logado como CLIENTE (Maria) | — | 200 + email; sem senhaHash na resposta | 01 Auth / T03 - Perfil do usuário autenticado |
| T04 | Positivo | Cadastrar novo cliente | `POST /usuarios` | sem token; e-mail ainda não cadastrado | `{"nome":"Cliente Postman","email":"<novoEmail>","senha":"Senha@123"}` | 201 + perfil=CLIENTE; sem senhaHash | 01 Auth / T04 - Cadastrar novo cliente |
| T05 | Positivo | Listar unidades (paginado) | `GET /unidades` | logado como CLIENTE (Maria); seed aplicado | `query: page=1&limit=10` | 200 + data[] (≥3 unidades) + meta.page=1 | 02 Catálogo / T05 - Listar unidades (paginado) |
| T06 | Positivo | Listar produtos com paginação | `GET /produtos` | logado como CLIENTE (Maria); seed aplicado | `query: page=1&limit=3` | 200 + no máximo 3 itens + meta.limit=3 / meta.total ≥ 6 | 02 Catálogo / T06 - Listar produtos com paginação |
| T07 | Positivo | Consultar cardápio da unidade (Matriz) | `GET /unidades/{matrizId}/cardapio` | logado como CLIENTE (Maria); seed aplicado | — | 200 + itens com preco (number) e emEstoque (boolean) | 02 Catálogo / T07 - Consultar cardápio da unidade (Matriz) |
| T08 | Positivo | Cadastrar produto | `POST /produtos` | logado como GERENTE (Matriz) | `{"nome":"Carne de Sol com Macaxeira","descricao":"Carne de sol acebolada com macaxeira","categoria":"Pratos","precoBase":42.9}` | 201 + id do produto + precoBase=42.9 | 02 Catálogo / T08 - Cadastrar produto |
| T09 | Positivo | Desativar produto (exclusão lógica) | `DELETE /produtos/{produtoNovoId}` | logado como ADMIN; produto criado no cenário anterior | — | 204 sem corpo | 02 Catálogo / T09 - Desativar produto (exclusão lógica) |
| T10 | Positivo | Consultar estoque da unidade | `GET /estoque` | logado como GERENTE (Matriz) | `query: unidadeId=<matrizId>&limit=100` | 200 + saldo (≥ 0) por produto da unidade | 03 Estoque / T10 - Consultar estoque da unidade |
| T11 | Positivo | Entrada de estoque | `POST /estoque/movimentos` | logado como GERENTE (Matriz); produto existente na unidade | `{"unidadeId":<matrizId>,"produtoId":<tapiocaId>,"tipo":"ENTRADA","quantidade":10,"motivo":"Reposição (teste Postman)"}` | 201 + tipo=ENTRADA + saldoAtual | 03 Estoque / T11 - Entrada de estoque |
| T12 | Positivo | Criar pedido válido (canal TOTEM) | `POST /pedidos` | logado como CLIENTE (Maria); estoque disponível na Matriz | `{"canalPedido":"TOTEM","unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":2},{"produtoId":<tapiocaId>,"quantidade":1}],"formaPagamento":"MOCK"} · header Idempotency-Key` | 201 + status=AGUARDANDO_PAGAMENTO + canalPedido=TOTEM + total=94.7 | 04 Pedidos / T12 - Criar pedido válido (canal TOTEM) |
| T13 | Positivo | Idempotência: repetir a mesma Idempotency-Key | `POST /pedidos` | logado como CLIENTE (Maria); pedido anterior criado com a mesma chave | `{"canalPedido":"TOTEM","unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":2},{"produtoId":<tapiocaId>,"quantidade":1}],"formaPagamento":"MOCK"} · header Idempotency-Key` | 200 + mesmo pedidoId (não cria outro pedido) | 04 Pedidos / T13 - Idempotência: repetir a mesma Idempotency-Key |
| T14 | Positivo | Filtrar pedidos por canal (TOTEM) | `GET /pedidos` | logado como CLIENTE (Maria); pedido TOTEM existente | `query: canalPedido=TOTEM&page=1&limit=10` | 200 + todos com canalPedido=TOTEM + meta de paginação | 04 Pedidos / T14 - Filtrar pedidos por canal (TOTEM) |
| T15 | Positivo | Pedido no balcão feito pelo atendente (canal BALCAO) | `POST /pedidos` | logado como ATENDENTE (Matriz); atendente da mesma unidade do pedido | `{"canalPedido":"BALCAO","unidadeId":<matrizId>,"clienteId":<mariaId>,"itens":[{"produtoId":<sucoId>,"quantidade":1}],"formaPagamento":"MOCK"}` | 201 + canalPedido=BALCAO + clienteId do cliente | 04 Pedidos / T15 - Pedido no balcão feito pelo atendente (canal BALCAO) |
| T16 | Positivo | Pagamento mock aprovado | `POST /pagamentos` | logado como CLIENTE (Maria); pedido AGUARDANDO_PAGAMENTO | `{"pedidoId":<pedidoId>} · header Idempotency-Key` | 201 + status=APROVADO + pedidoStatus=PAGO + payload do gateway | 05 Pagamento / T16 - Pagamento mock aprovado |
| T17 | Positivo | Repetir pagamento com a mesma Idempotency-Key | `POST /pagamentos` | logado como CLIENTE (Maria); pagamento anterior com a mesma chave | `{"pedidoId":<pedidoId>} · header Idempotency-Key` | 200 + mesmo pagamentoId (sem nova cobrança) | 05 Pagamento / T17 - Repetir pagamento com a mesma Idempotency-Key |
| T18 | Positivo | Pontos acumulados após pagamento (cliente com consentimento) | `GET /fidelidade/saldo` | logado como CLIENTE (Maria); pagamento aprovado de R$ 94,70 | — | 200 + consentimentoAtivo=true + saldoPontos ≥ 94 | 05 Pagamento / T18 - Pontos acumulados após pagamento (cliente com consentimento) |
| T19 | Negativo | Pagamento mock recusado | `POST /pagamentos` | logado como CLIENTE (Maria); pedido AGUARDANDO_PAGAMENTO; simulacao=RECUSAR | `{"pedidoId":<pedidoRecusadoId>,"simulacao":"RECUSAR"}` | 201 + status=RECUSADO + pedidoStatus=CANCELADO + mensagem de recusa | 05 Pagamento / T19 - Pagamento mock recusado |
| T20 | Positivo | Estoque devolvido após pagamento recusado | `GET /estoque` | logado como GERENTE (Matriz); pedido recusado no cenário anterior | `query: unidadeId=<matrizId>&limit=100` | 200 + saldo do Baião de Dois igual ao de antes do pedido (estorno) | 05 Pagamento / T20 - Estoque devolvido após pagamento recusado |
| T21 | Negativo | Gateway de pagamento indisponível | `POST /pagamentos` | logado como CLIENTE (Maria); pedido AGUARDANDO_PAGAMENTO; simulacao=INDISPONIVEL | `{"pedidoId":<pedidoIndispId>,"simulacao":"INDISPONIVEL"}` | 503 + error=SERVICO_PAGAMENTO_INDISPONIVEL (erro padrão) | 05 Pagamento / T21 - Gateway de pagamento indisponível |
| T22 | Positivo | Pedido continua aguardando pagamento | `GET /pedidos/{pedidoIndispId}` | logado como CLIENTE (Maria); falha do gateway no cenário anterior | — | 200 + status=AGUARDANDO_PAGAMENTO (tolerância a falhas) | 05 Pagamento / T22 - Pedido continua aguardando pagamento |
| T23 | Positivo | Nova tentativa de pagamento aprovada | `POST /pagamentos` | logado como CLIENTE (Maria); pedido ainda AGUARDANDO_PAGAMENTO | `{"pedidoId":<pedidoIndispId>}` | 201 + status=APROVADO + pedidoStatus=PAGO | 05 Pagamento / T23 - Nova tentativa de pagamento aprovada |
| T24 | Positivo | Cozinha inicia o preparo | `PATCH /pedidos/{pedidoId}/status` | logado como COZINHA (Matriz); pedido PAGO | `{"status":"EM_PREPARO"}` | 200 + status=EM_PREPARO | 06 Status do pedido / T24 - Cozinha inicia o preparo |
| T25 | Positivo | Cozinha marca como pronto | `PATCH /pedidos/{pedidoId}/status` | logado como COZINHA (Matriz); pedido EM_PREPARO | `{"status":"PRONTO"}` | 200 + status=PRONTO | 06 Status do pedido / T25 - Cozinha marca como pronto |
| T26 | Positivo | Atendente marca como entregue | `PATCH /pedidos/{pedidoId}/status` | logado como ATENDENTE (Matriz); pedido PRONTO | `{"status":"ENTREGUE"}` | 200 + status=ENTREGUE | 06 Status do pedido / T26 - Atendente marca como entregue |
| T27 | Positivo | Cliente sem consentimento não acumula pontos | `GET /fidelidade/saldo` | logado como CLIENTE (João); pedido pago, sem consentimento ativo | — | 200 + consentimentoAtivo=false + saldoPontos=0 (RN08) | 07 Fidelidade e Promoção / T27 - Cliente sem consentimento não acumula pontos |
| T28 | Positivo | Conceder consentimento do programa de fidelidade | `POST /fidelidade/consentimento` | logado como CLIENTE (João); sem consentimento ativo | — | 201 + concedido=true + baseLegal + versaoTermo (LGPD) | 07 Fidelidade e Promoção / T28 - Conceder consentimento do programa de fidelidade |
| T29 | Negativo | Conceder consentimento duas vezes | `POST /fidelidade/consentimento` | logado como CLIENTE (João); consentimento já ativo | — | 409 + error=CONSENTIMENTO_JA_ATIVO | 07 Fidelidade e Promoção / T29 - Conceder consentimento duas vezes |
| T30 | Positivo | Revogar consentimento | `DELETE /fidelidade/consentimento` | logado como CLIENTE (João); consentimento ativo | — | 204 sem corpo | 07 Fidelidade e Promoção / T30 - Revogar consentimento |
| T31 | Positivo | Resgatar pontos no pedido (50 pontos = R$ 5,00) | `POST /pedidos` | logado como CLIENTE (Maria); cliente com consentimento e saldo ≥ 50 pontos | `{"canalPedido":"APP","unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":1}],"formaPagamento":"PIX","pontosResgatar":50}` | 201 + desconto=5 + total=34.9 | 07 Fidelidade e Promoção / T31 - Resgatar pontos no pedido (50 pontos = R$ 5,00) |
| T32 | Positivo | Saldo reduzido após o resgate | `GET /fidelidade/saldo` | logado como CLIENTE (Maria); resgate de 50 pontos feito | — | 200 + saldoPontos = saldo anterior − 50 | 07 Fidelidade e Promoção / T32 - Saldo reduzido após o resgate |
| T33 | Positivo | Cancelar pedido devolve os pontos | `PATCH /pedidos/{pedidoResgateId}/status` | logado como CLIENTE (Maria); pedido AGUARDANDO_PAGAMENTO do próprio cliente | `{"status":"CANCELADO"}` | 200 + status=CANCELADO | 07 Fidelidade e Promoção / T33 - Cancelar pedido devolve os pontos |
| T34 | Positivo | Saldo restaurado após o cancelamento | `GET /fidelidade/saldo` | logado como CLIENTE (Maria); pedido com resgate cancelado | — | 200 + saldoPontos igual ao de antes do resgate (estorno) | 07 Fidelidade e Promoção / T34 - Saldo restaurado após o cancelamento |
| T35 | Positivo | Aplicar promoção BEMVINDO10 (10%) | `POST /pedidos` | logado como CLIENTE (Maria); promoção vigente no seed | `{"canalPedido":"WEB","unidadeId":<matrizId>,"itens":[{"produtoId":<tapiocaId>,"quantidade":1}],"formaPagamento":"MOCK","codigoPromocao":"BEMVINDO10"}` | 201 + promocao=BEMVINDO10 + desconto=1.49 + total=13.41 | 07 Fidelidade e Promoção / T35 - Aplicar promoção BEMVINDO10 (10%) |
| T36 | Positivo | Trilha de auditoria do pedido | `GET /auditoria` | logado como GERENTE (Matriz); pedido percorreu criação, pagamento e entrega | `query: entidade=Pedido&entidadeId=<pedidoId>&limit=50` | 200 + logs PEDIDO_CRIADO e PEDIDO_STATUS_ALTERADO (≥ 5 registros) | 08 Auditoria / T36 - Trilha de auditoria do pedido |
| T37 | Positivo | Auditoria registra o cancelamento por pagamento recusado | `GET /auditoria` | logado como GERENTE (Matriz); pagamento recusado anteriormente | `query: acao=PEDIDO_CANCELADO&entidadeId=<pedidoRecusadoId>` | 200 + log PEDIDO_CANCELADO com detalhes.motivo='Pagamento recusado' | 08 Auditoria / T37 - Auditoria registra o cancelamento por pagamento recusado |
| T38 | Negativo | Login com senha errada | `POST /auth/login` | sem token; usuário cadastrado | `{"email":"maria@exemplo.com","senha":"SenhaErrada1"}` | 401 + error=CREDENCIAIS_INVALIDAS | 09 Erros / T38 - Login com senha errada |
| T39 | Negativo | Listar pedidos sem token | `GET /pedidos` | sem token | — | 401 + error=NAO_AUTENTICADO | 09 Erros / T39 - Listar pedidos sem token |
| T40 | Negativo | Listar pedidos com token inválido | `GET /pedidos` | sem token | — | 401 + error=TOKEN_INVALIDO | 09 Erros / T40 - Listar pedidos com token inválido |
| T41 | Negativo | Cliente tenta cadastrar produto (sem permissão) | `POST /produtos` | logado como CLIENTE (Maria) | `{"nome":"Produto Proibido","categoria":"Teste","precoBase":10}` | 403 + error=ACESSO_NEGADO | 09 Erros / T41 - Cliente tenta cadastrar produto (sem permissão) |
| T42 | Negativo | Cadastro sem e-mail | `POST /usuarios` | sem token | `{"nome":"Sem Email","senha":"Senha@123"}` | 422 + details cita o campo email | 09 Erros / T42 - Cadastro sem e-mail |
| T43 | Negativo | Cadastro com e-mail em formato inválido | `POST /usuarios` | sem token | `{"nome":"Email Ruim","email":"abc","senha":"Senha@123"}` | 422 + details cita o campo email | 09 Erros / T43 - Cadastro com e-mail em formato inválido |
| T44 | Negativo | Cadastro com e-mail já existente | `POST /usuarios` | sem token; e-mail cadastrado no cenário de cadastro | `{"nome":"Duplicado","email":"<novoEmail>","senha":"Senha@123"}` | 409 + error=EMAIL_JA_CADASTRADO | 09 Erros / T44 - Cadastro com e-mail já existente |
| T45 | Negativo | Pedido sem canalPedido | `POST /pedidos` | logado como CLIENTE (Maria) | `{"unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":1}],"formaPagamento":"MOCK"}` | 422 + details cita o campo canalPedido | 09 Erros / T45 - Pedido sem canalPedido |
| T46 | Negativo | Pedido com canalPedido inválido | `POST /pedidos` | logado como CLIENTE (Maria) | `{"canalPedido":"DRONE","unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":1}],"formaPagamento":"MOCK"}` | 422 + details cita o campo canalPedido | 09 Erros / T46 - Pedido com canalPedido inválido |
| T47 | Negativo | Pedido com quantidade negativa | `POST /pedidos` | logado como CLIENTE (Maria) | `{"canalPedido":"APP","unidadeId":<matrizId>,"itens":[{"produtoId":<baiaoId>,"quantidade":-1}],"formaPagamento":"MOCK"}` | 422 + details cita o campo da quantidade | 09 Erros / T47 - Pedido com quantidade negativa |
| T48 | Negativo | Pedido com produto inexistente | `POST /pedidos` | logado como CLIENTE (Maria) | `{"canalPedido":"APP","unidadeId":<matrizId>,"itens":[{"produtoId":999999,"quantidade":1}],"formaPagamento":"MOCK"}` | 404 + error=PRODUTO_NAO_ENCONTRADO | 09 Erros / T48 - Pedido com produto inexistente |
| T49 | Negativo | Pedido com produto fora do cardápio da unidade | `POST /pedidos` | logado como CLIENTE (Maria); Salvador não vende Bolo de Rolo (seed) | `{"canalPedido":"APP","unidadeId":<salvadorId>,"itens":[{"produtoId":<boloId>,"quantidade":1}],"formaPagamento":"MOCK"}` | 404 + error=PRODUTO_NAO_ENCONTRADO | 09 Erros / T49 - Pedido com produto fora do cardápio da unidade |
| T50 | Negativo | Pedido com estoque insuficiente | `POST /pedidos` | logado como CLIENTE (Maria); Macaxeira Frita tem apenas 1 unidade na Matriz (seed) | `{"canalPedido":"PICKUP","unidadeId":<matrizId>,"itens":[{"produtoId":<macaxeiraId>,"quantidade":2}],"formaPagamento":"MOCK"}` | 409 + error=ESTOQUE_INSUFICIENTE + details 'Disponível: 1' | 09 Erros / T50 - Pedido com estoque insuficiente |
| T51 | Negativo | Pagar pedido que já foi pago | `POST /pagamentos` | logado como CLIENTE (Maria); pedido já ENTREGUE | `{"pedidoId":<pedidoId>}` | 409 + error=PEDIDO_NAO_AGUARDA_PAGAMENTO | 09 Erros / T51 - Pagar pedido que já foi pago |
| T52 | Negativo | Transição de status inválida | `PATCH /pedidos/{pedidoId}/status` | logado como ATENDENTE (Matriz); pedido já ENTREGUE | `{"status":"PAGO"}` | 409 + error=TRANSICAO_INVALIDA | 09 Erros / T52 - Transição de status inválida |
| T53 | Negativo | Cliente tenta mudar o status para EM_PREPARO | `PATCH /pedidos/{pedidoIndispId}/status` | logado como CLIENTE (Maria); pedido PAGO; só a cozinha/gerência pode iniciar o preparo | `{"status":"EM_PREPARO"}` | 403 + error=ACESSO_NEGADO | 09 Erros / T53 - Cliente tenta mudar o status para EM_PREPARO |
| T54 | Negativo | Cliente consulta pedido de outro cliente | `GET /pedidos/{pedidoId}` | logado como CLIENTE (João); pedido pertence à Maria | — | 404 + error=PEDIDO_NAO_ENCONTRADO (não revela que existe) | 09 Erros / T54 - Cliente consulta pedido de outro cliente |
| T55 | Negativo | Resgatar pontos sem consentimento | `POST /pedidos` | logado como CLIENTE (João); consentimento revogado | `{"canalPedido":"APP","unidadeId":<matrizId>,"itens":[{"produtoId":<tapiocaId>,"quantidade":1}],"formaPagamento":"MOCK","pontosResgatar":10}` | 409 + error=CONSENTIMENTO_NECESSARIO (nada é gravado) | 09 Erros / T55 - Resgatar pontos sem consentimento |
| T56 | Negativo | Cliente tenta consultar a auditoria | `GET /auditoria` | logado como CLIENTE (Maria) | — | 403 + error=ACESSO_NEGADO | 09 Erros / T56 - Cliente tenta consultar a auditoria |
| T57 | Negativo | Gerente tenta movimentar estoque de outra unidade | `POST /estoque/movimentos` | logado como GERENTE (Matriz); gerente vinculado à Matriz | `{"unidadeId":<fortalezaId>,"produtoId":<tapiocaId>,"tipo":"ENTRADA","quantidade":5}` | 403 + error=UNIDADE_NAO_PERMITIDA | 09 Erros / T57 - Gerente tenta movimentar estoque de outra unidade |
| T58 | Negativo | Consultar produto desativado | `GET /produtos/{produtoNovoId}` | logado como GERENTE (Matriz); produto desativado anteriormente | — | 404 + error=PRODUTO_NAO_ENCONTRADO | 09 Erros / T58 - Consultar produto desativado |
| T59 | Negativo | Cardápio de unidade inexistente | `GET /unidades/999999/cardapio` | logado como CLIENTE (Maria) | — | 404 + error=UNIDADE_NAO_ENCONTRADA | 09 Erros / T59 - Cardápio de unidade inexistente |

## Cobertura do item 8.3 do roteiro

| Requisito obrigatório | Cenários |
|---|---|
| a) Autenticação: login com token válido | T02 |
| a) Autenticação: acesso sem token / token inválido (401) | T39, T40 |
| a) Autorização: perfil sem permissão (403) | T41, T53, T56, T57 |
| b) Validação: campo obrigatório ausente (422) | T42, T45 |
| b) Validação: tipo/formato inválido (422) | T43, T46, T47 |
| c) Regra de negócio: pedido com itens válidos → 201 | T12 |
| c) Regra de negócio: produto/unidade inexistente (404) | T48, T49, T59 |
| c) Regra de negócio: estoque insuficiente (409) | T50 |
| d) Pagamento mock aprovado → status do pedido atualizado | T16, T23 |
| d) Pagamento mock recusado → status e mensagem coerentes | T19 |
| e) Logs/auditoria: ação sensível gera registro | T36, T37 |

## Evidência adicional

- Toda resposta com status ≥ 400 é verificada por um teste de coleção que exige o JSON padrão de erro (`error`, `message`, `details`, `timestamp`, `path`).
- Idempotência (T13, T17): repetir a `Idempotency-Key` não duplica pedido nem cobrança.
- Rastreabilidade LGPD: cenários de consentimento, ausência de `senhaHash` nas respostas e trilha de auditoria.
