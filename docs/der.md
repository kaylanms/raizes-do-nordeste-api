# Diagrama de Entidades e Relacionamentos (DER)

## 1. Modelo Visual (Mermaid)

```mermaid
erDiagram
    UNIDADES ||--o{ CARDAPIO_UNIDADE : "ofertado em"
    PRODUTOS ||--o{ CARDAPIO_UNIDADE : "possui"
    UNIDADES ||--o{ ESTOQUE : "controlado em"
    PRODUTOS ||--o{ ESTOQUE : "possui"
    UNIDADES ||--o{ USUARIOS : "equipe vinculada"
    USUARIOS ||--o{ PEDIDOS : "realiza"
    UNIDADES ||--o{ PEDIDOS : "recebe"
    PROMOCOES ||--o{ PEDIDOS : "aplicada em"
    PEDIDOS ||--o{ ITENS_PEDIDO : "contem"
    PRODUTOS ||--o{ ITENS_PEDIDO : "vendido em"
    PEDIDOS ||--o{ PAGAMENTOS : "tentativas"
    PEDIDOS ||--o{ MOVIMENTOS_ESTOQUE : "baixa/estorno"
    ESTOQUE ||--o{ MOVIMENTOS_ESTOQUE : "historico"
    USUARIOS ||--o{ CONSENTIMENTOS : "concede"
    USUARIOS ||--o{ MOVIMENTOS_PONTOS : "possui"
    PEDIDOS ||--o{ MOVIMENTOS_PONTOS : "origina"
    USUARIOS ||--o{ LOGS_AUDITORIA : "gera"

    UNIDADES {
        int id PK
        string nome
        string cidade
        string uf
        boolean matriz
        boolean ativa
    }

    USUARIOS {
        int id PK
        string nome
        string email UK
        string senha_hash
        enum perfil
        int unidade_id FK "nulo para CLIENTE"
        boolean ativo
        datetime criado_em
        datetime anonimizado_em
    }

    CARDAPIO_UNIDADE {
        int unidade_id PK,FK
        int produto_id PK,FK
        decimal preco
        boolean disponivel
    }

    PRODUTOS {
        int id PK
        string nome
        string descricao
        string categoria
        decimal preco_base
        boolean ativo
    }

    ESTOQUE {
        int id PK
        int unidade_id FK
        int produto_id FK
        int quantidade "CHECK >= 0"
    }

    PEDIDOS {
        int id PK
        int cliente_id FK
        int unidade_id FK
        enum canal_pedido
        enum status
        decimal subtotal
        decimal desconto
        decimal total
        int promocao_id FK "opcional"
        string forma_pagamento
        string idempotency_key UK
        datetime criado_em
        datetime atualizado_em
    }

    ITENS_PEDIDO {
        int id PK
        int pedido_id FK
        int produto_id FK
        int quantidade "CHECK > 0"
        decimal preco_unitario
    }

    PAGAMENTOS {
        int id PK
        int pedido_id FK
        enum status "PENDENTE, APROVADO, RECUSADO"
        decimal valor
        string metodo
        string referencia_externa
        json payload_resposta
        string idempotency_key UK
        datetime criado_em
    }

    MOVIMENTOS_ESTOQUE {
        int id PK
        int estoque_id FK
        int pedido_id FK "opcional"
        int usuario_id FK
        enum tipo "ENTRADA, SAIDA, ESTORNO"
        int quantidade
        string motivo
        datetime criado_em
    }

    CONSENTIMENTOS {
        int id PK
        int usuario_id FK
        enum finalidade
        string base_legal
        string versao_termo
        boolean concedido
        datetime registrado_em
        datetime revogado_em
    }

    MOVIMENTOS_PONTOS {
        int id PK
        int usuario_id FK
        int pedido_id FK "opcional"
        enum tipo "ACUMULO, RESGATE, ESTORNO"
        int pontos
        datetime criado_em
    }

    LOGS_AUDITORIA {
        int id PK
        int usuario_id FK "opcional"
        string acao
        string entidade
        int entidade_id
        json detalhes
        datetime criado_em
    }

    PROMOCOES {
        int id PK
        string codigo UK
        string descricao
        enum tipo "PERCENTUAL, VALOR_FIXO"
        decimal valor
        datetime inicio
        datetime fim
        boolean ativa
    }
```

## 2. Decisões de Modelagem e Justificativas

- **Estoque por Unidade:** Restrição `UNIQUE (unidade_id, produto_id)` com `CHECK (quantidade >= 0)` garante o isolamento do saldo entre filiais e impede que o banco aceite saldo negativo.
- **Cardápio por Unidade:** A tabela relacional `CARDAPIO_UNIDADE` habilita a personalização de preços e a disponibilidade de itens por filial.
- **Pagamento Desacoplado:** Relacionamento $1:N$ entre `PEDIDOS` e `PAGAMENTOS` para registrar histórico de tentativas de pagamento, persistindo a resposta na coluna `payload_resposta` (tipo JSON).
- **Histórico e Rastreabilidade de Estoque:** O saldo atual é mantido em `ESTOQUE`, enquanto alterações de entrada, saída ou estorno são auditadas em `MOVIMENTOS_ESTOQUE`.
- **Snapshot de Preço nos Itens:** A coluna `preco_unitario` em `ITENS_PEDIDO` armazena o preço exato do produto no instante da compra, garantindo a integridade dos relatórios financeiros caso o preço base do produto mude no futuro.
- **Consistência do Saldo de Fidelidade:** O saldo total de pontos de um cliente é calculated via soma dos registros em `MOVIMENTOS_PONTOS` (`ACUMULO` – `RESGATE`), eliminando duplicidade ou divergência de saldos gravados.
- **Tratamento de Idempotência:** Aplicação de restrição `UNIQUE` sobre a coluna `idempotency_key` nas tabelas `PEDIDOS` e `PAGAMENTOS`.
- **Otimização de Desempenho (Horários de Pico):**
  - Índice em `pedidos(unidade_id, canal_pedido, status)`
  - Índice em `pedidos(cliente_id)`
  - Índice em `estoque(unidade_id, produto_id)`
