# Mapeamento e Especificação de Casos de Uso

## 1. Mapeamento de Atores e Casos de Uso

| Ator                              | Casos de Uso Associados                                                                                                                                                                                                                                              |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cliente** _(App / Web / Totem)_ | **UC01** Cadastrar-se · **UC02** Fazer login · **UC03** Consultar cardápio · **UC04** Realizar pedido · **UC05** Solicitar pagamento · **UC06** Acompanhar pedido · **UC07** Cancelar pedido · **UC08** Consultar/resgatar pontos · **UC09** Gerenciar consentimento |
| **Atendente** _(Balcão)_          | **UC04** Realizar pedido no balcão · **UC10** Consultar pedidos da unidade · **UC11** Marcar pedido como entregue                                                                                                                                                    |
| **Cozinha**                       | **UC12** Iniciar preparo · **UC13** Marcar pedido como pronto                                                                                                                                                                                                        |
| **Gerente / Admin**               | **UC14** Gerenciar produtos e cardápio · **UC15** Movimentar estoque · **UC16** Gerenciar unidades e usuários · **UC17** Consultar auditoria · **UC18** Gerenciar promoções                                                                                          |
| **Gateway de Pagamento** _(Mock)_ | Recebe requisição de cobrança (**UC05**) e devolve confirmação (aprovado/recusado)                                                                                                                                                                                   |

---

## 2. Descrição Detalhada da Feature: "Realizar Pedido + Solicitar Pagamento"

- **Ator Principal:** Cliente (App/Web/Totem)
- **Atores Secundários:** Gateway de Pagamento (Mock), Atendente (Balcão)

### Pré-condições

1. Usuário autenticado com token JWT válido (perfil `CLIENTE` ou `ATENDENTE`).
2. Unidade operacional ativa com produtos cadastrados no cardápio local.

### Fluxo Principal

1. O cliente envia uma requisição `POST /pedidos` com `canalPedido`, `unidadeId`, `itens` e `formaPagamento`.
2. O sistema valida o token JWT, as permissões de acesso e o payload recebido (`canalPedido` é obrigatório).
3. O sistema valida a existência da unidade e se os produtos informados constam no cardápio da unidade.
4. O sistema consulta o estoque da unidade para validar se há quantidade suficiente para cada item (`RN02`).
5. Em uma transação atômica, o sistema cria o registro em `PEDIDOS` com status `AGUARDANDO_PAGAMENTO`, registra o snapshot dos preços vigentes, calcula os totais e efetua a baixa de estoque (movimentação de `SAIDA`).
6. O sistema insere um registro na auditoria e retorna `201 Created`.
7. O cliente realiza a chamada `POST /pagamentos` passando o `pedidoId`.
8. O sistema aciona o gateway mock e registra a resposta na tabela de pagamentos.
9. Em caso de aprovação, o status do pedido é alterado para `PAGO`, os pontos de fidelidade são acumulados (caso haja consentimento) e o sistema retorna `200 OK`.

### Fluxos Alternativos e Exceções

- **A1 (Estoque Insuficiente):** Retorna `409 Conflict` (`ESTOQUE_INSUFICIENTE`). Nenhuma alteração é gravada no banco.
- **A2 (Entidade Não Encontrada):** Retorna `404 Not Found` caso produto ou unidade não existam.
- **A3 (Payload Inválido):** Retorna `422 Unprocessable Entity` se `canalPedido` for omitido ou inválido.
- **A4 (Pagamento Recusado):** Registra pagamento com status `RECUSADO`, altera o pedido para `CANCELADO` e executa a entrada de estorno no estoque (`RN05`).
- **A5 (Gateway Indisponível):** O pagamento é gravado como `PENDENTE` e o pedido permanece em `AGUARDANDO_PAGAMENTO`, permitindo nova tentativa pelo cliente (`RN06`).
- **A6 (Requisição Duplicada):** Ao identificar um `Idempotency-Key` já processado, o sistema retransmite a resposta original sem gerar nova cobrança ou duplicar o pedido (`RN07`).

### Pós-condições

- Pedido persistido com canal, itens e total calculado.
- Estoque devidamente atualizado.
- Pagamento registrado com o payload retornado pelo gateway.
- Ação armazenada nos logs de auditoria.

---

## 3. Regras de Negócio e Máquina de Estados

### Regras de Negócio (RN)

- **RN01:** O preço do item é fixado no pedido no instante do registro (snapshot de preço).
- **RN02:** A criação do pedido depende de estoque disponível para a totalidade dos itens.
- **RN03:** O controle de estoque é isolado por unidade (`unidade_id` + `produto_id`).
- **RN04:** As alterações do pedido devem obrigatoriamente respeitar a máquina de estados validada.
- **RN05:** Pagamento recusado ocasiona o cancelamento automático e devolução de estoque.
- **RN06:** Falhas de comunicação com o gateway não devem cancelar o pedido de imediato.
- **RN07:** O uso de `Idempotency-Key` em requisições repetidas previne efeitos colaterais duplicados.
- **RN08:** Pontos de fidelidade dependem de consentimento LGPD ativo.
- **RN09:** Clientes acessam apenas os próprios pedidos; funcionários visualizam pedidos vinculados à sua unidade.

### Máquina de Estados do Pedido (RN04)

| Estado Origem          | Estado Destino | Responsável pela Ação                                     |
| :--------------------- | :------------- | :-------------------------------------------------------- |
| `AGUARDANDO_PAGAMENTO` | `PAGO`         | Sistema (Pagamento Aprovado)                              |
| `AGUARDANDO_PAGAMENTO` | `CANCELADO`    | Cliente, Atendente, Gerente, Sistema (Pagamento Recusado) |
| `PAGO`                 | `EM_PREPARO`   | Cozinha                                                   |
| `EM_PREPARO`           | `PRONTO`       | Cozinha                                                   |
| `PRONTO`               | `ENTREGUE`     | Atendente, Gerente                                        |
| `PAGO` / `EM_PREPARO`  | `CANCELADO`    | Gerente                                                   |

_Qualquer transição fora desse fluxo é rejeitada com o código HTTP `409 Conflict`._
