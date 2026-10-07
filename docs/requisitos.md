# Especificação de Requisitos e Regras do Sistema

## 1. Contexto e Escopo

A **Raízes do Nordeste** é uma rede de lanchonetes/restaurantes composta por uma matriz e diversas unidades operacionais. Cada unidade mantém cardápio e saldo de estoque próprios. Os pedidos são originados por múltiplos canais (Aplicativo, Totem, Balcão, Retirada e Web).

O sistema back-end centraliza a gestão de pedidos, controle de estoque por unidade, processamento simulado de pagamentos, programa de fidelidade e auditoria, assegurando conformidade com as diretrizes da LGPD.

---

## 2. Requisitos Funcionais (RF)

| ID       | Requisito                                                                          | Prioridade |
| :------- | :--------------------------------------------------------------------------------- | :--------- |
| **RF01** | Cadastrar usuário (cliente) e consultar o próprio perfil                           | Alta       |
| **RF02** | Autenticar via e-mail e senha, retornando token JWT                                | Alta       |
| **RF03** | Controlar acesso por perfil: `CLIENTE`, `ATENDENTE`, `COZINHA`, `GERENTE`, `ADMIN` | Alta       |
| **RF04** | Gerenciar unidades da rede (listar; criar/editar por ADMIN)                        | Média      |
| **RF05** | Gerenciar produtos (CRUD por ADMIN/GERENTE)                                        | Alta       |
| **RF06** | Consultar o cardápio de uma unidade (com paginação)                                | Alta       |
| **RF07** | Registrar entrada e saída de estoque por unidade                                   | Alta       |
| **RF08** | Impedir venda de produto sem estoque suficiente (retorno `409 Conflict`)           | Alta       |
| **RF09** | Criar pedido com itens, valores e `canalPedido` obrigatório                        | Alta       |
| **RF10** | Listar e filtrar pedidos por canal, status e unidade (`?canalPedido=TOTEM`)        | Alta       |
| **RF11** | Atualizar status do pedido seguindo as transições válidas                          | Alta       |
| **RF12** | Cancelar pedido, devolvendo o estoque correspondente                               | Média      |
| **RF13** | Solicitar pagamento ao serviço externo mock e registrar o retorno                  | Alta       |
| **RF14** | Acumular pontos de fidelidade ao ter o pagamento aprovado (mediante consentimento) | Média      |
| **RF15** | Resgatar pontos como desconto, consultar saldo e histórico                         | Média      |
| **RF16** | Registrar e revogar consentimento do cliente (LGPD)                                | Média      |
| **RF17** | Aplicar promoções/campanhas                                                        | Baixa      |
| **RF18** | Registrar auditoria de ações sensíveis no sistema                                  | Média      |

---

## 3. Requisitos Não Funcionais (RNF)

| ID        | Requisito                      | Estratégia de Atendimento                                                                     |
| :-------- | :----------------------------- | :-------------------------------------------------------------------------------------------- |
| **RNF01** | Senha com hash                 | Criptografia com `bcrypt` (hash jamais exposto em respostas da API)                           |
| **RNF02** | Autenticação por token         | Token JWT com expiração configurada (ex.: 1h)                                                 |
| **RNF03** | Controle de acesso             | Decoradores e Guards por perfil nos endpoints do NestJS                                       |
| **RNF04** | LGPD                           | Princípios de finalidade, minimização, consentimento e anonimização                           |
| **RNF05** | Logs de auditoria              | Registro persistido na tabela `logs_auditoria`                                                |
| **RNF06** | Desempenho em pico             | Criação de índices no banco, paginação e transações curtas                                    |
| **RNF07** | Tolerância a falhas no gateway | Gateway mock simula indisponibilidade sem comprometer o pedido                                |
| **RNF08** | Idempotência                   | Suporte ao header `Idempotency-Key` em rotas críticas (`POST /pedidos` e `POST /pagamentos`)  |
| **RNF09** | Padrão de erro único           | Respostas padronizadas em JSON contendo `error`, `message`, `timestamp`, `path` e `requestId` |
| **RNF10** | Documentação                   | Documentação interativa via Swagger/OpenAPI                                                   |
| **RNF11** | Reprodutibilidade              | Ambiente orquestrado com Docker Compose, scripts de migration e seed                          |

---

## 4. Multicanalidade

O sistema suporta origem de pedidos através da enumeração `CanalPedido`:

- `APP`
- `TOTEM`
- `BALCAO`
- `PICKUP`
- `WEB`

**Regras do canal:**

1. O parâmetro `canalPedido` é de envio obrigatório no corpo da requisição de criação do pedido (`POST /pedidos`). Caso omitido ou inválido, a API retorna `422 Unprocessable Entity`.
2. A listagem de pedidos permite filtragem explícita por canal via query parameter (`GET /pedidos?canalPedido=TOTEM`).
3. O canal permanece registrado no pedido para garantia de rastreabilidade.

---

## 5. Adequação à LGPD

| Dado                     | Finalidade                              | Base Legal (LGPD, art. 7º)      | Retenção / Minimização                                                 |
| :----------------------- | :-------------------------------------- | :------------------------------ | :--------------------------------------------------------------------- |
| **Nome e E-mail**        | Identificação e autenticação do cliente | Execução de contrato (Inciso V) | Coleta restrita ao essencial (sem exigência de CPF ou endereço no MVP) |
| **Senha**                | Autenticação de segurança               | Execução de contrato (Inciso V) | Armazenado exclusivamente como hash `bcrypt`                           |
| **Histórico de Pedidos** | Gestão operacional e atendimento        | Execução de contrato (Inciso V) | Mantido vinculado ao cadastro enquanto ativo                           |
| **Pontos de Fidelidade** | Concessão de benefícios                 | Consentimento (Inciso I)        | Exige aceite explícito gravado em tabela de consentimentos             |
| **Logs de Auditoria**    | Rastreabilidade e segurança             | Legítimo interesse (Inciso IX)  | Registros livres de senhas ou dados sensíveis                          |

---

## 6. Matriz de Permissões por Perfil

| Recurso / Ação                               |    CLIENTE     | ATENDENTE  |  COZINHA   |  GERENTE   | ADMIN |
| :------------------------------------------- | :------------: | :--------: | :--------: | :--------: | :---: |
| **Visualizar Cardápio**                      |       ✅       |     ✅     |     ✅     |     ✅     |  ✅   |
| **Criar Pedido**                             |       ✅       |     ✅     |     ❌     |     ✅     |  ✅   |
| **Visualizar Pedidos**                       | Apenas os seus | Da unidade | Da unidade | Da unidade | Todos |
| **Status $\rightarrow$ EM_PREPARO / PRONTO** |       ❌       |     ❌     |     ✅     |     ✅     |  ✅   |
| **Status $\rightarrow$ ENTREGUE**            |       ❌       |     ✅     |     ❌     |     ✅     |  ✅   |
| **Movimentar Estoque**                       |       ❌       |     ❌     |     ❌     |     ✅     |  ✅   |
| **CRUD Produtos / Unidades**                 |       ❌       |     ❌     |     ❌     |  Produtos  | Todos |
| **Visualizar Auditoria**                     |       ❌       |     ❌     |     ❌     |     ✅     |  ✅   |
