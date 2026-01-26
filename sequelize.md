# Sequelize no projeto UC7 (tutorial rápido)

Este guia mostra como **seria o projeto usando Sequelize** com **validações completas** nos modelos. A proposta aqui é didática: manter a estrutura por módulos e substituir as queries SQL por models.

> Por enquanto vamos usar `sequelize.sync({ force: true, alter: true })`. Mais tarde você pode trocar para migrations.

---

## 1) Dependências

Instale:

- `sequelize`
- `pg`
- `pg-hstore`
- `bcryptjs` (para hash de senha, já usado no projeto)

---

## 2) Configuração do Sequelize

Sugestão de arquivo: `src/database/sequelize.js`

```js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada no .env");
}

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  define: {
    underscored: true, // campos snake_case no banco
    timestamps: true,
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
    deletedAt: "excluido_em",
    paranoid: true,
  },
});
```

---

## 3) Models (com validações)

Abaixo está um **exemplo completo** dos modelos com validações equivalentes ao schema SQL atual.

> Observação: usamos `UUID` com `defaultValue: DataTypes.UUIDV4`.

### 3.1) Usuario

```js
import { DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../../database/sequelize.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 120],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true,
        len: [5, 120],
      },
    },
    perfil: {
      type: DataTypes.ENUM("admin", "seller", "cliente"),
      allowNull: false,
    },
    senha_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255],
      },
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
    },
    excluido_em: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "usuarios",
  },
);

// Exemplo didático de hook (opcional):
Usuario.addHook("beforeCreate", async (usuario) => {
  if (usuario.senha_hash && !usuario.senha_hash.startsWith("$2")) {
    usuario.senha_hash = await bcrypt.hash(usuario.senha_hash, 10);
  }
});
```

### 3.2) Cliente

```js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const Cliente = sequelize.define(
  "Cliente",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 120],
      },
    },
    documento: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [5, 30],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
        len: [5, 120],
      },
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [8, 30],
      },
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
    },
    excluido_em: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "clientes",
  },
);
```

### 3.3) Veiculo

```js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

const anoMax = new Date().getFullYear() + 1;

export const Veiculo = sequelize.define(
  "Veiculo",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vin: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [11, 17],
      },
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 60],
      },
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 80],
      },
    },
    ano_modelo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1886,
        max: anoMax,
      },
    },
    cor: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 30],
      },
    },
    km: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
      },
    },
    preco_compra: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    preco_venda: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM("DISPONIVEL", "RESERVADO", "VENDIDO", "INATIVO"),
      allowNull: false,
      defaultValue: "DISPONIVEL",
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
    },
    excluido_em: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "veiculos",
  },
);
```

### 3.4) Venda

```js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const Venda = sequelize.define(
  "Venda",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK para VEICULOS
    // - references: aponta para a tabela/coluna alvo da FK no banco
    // - onUpdate/onDelete: define a ação quando o registro pai muda/é removido
    veiculo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        // model pode ser o nome da tabela (string) ou o Model
        model: "veiculos",
        key: "id",
      },
      // CASCADE: atualiza/chama delete em cascata nos filhos
      // RESTRICT: bloqueia a operação se houver filhos
      // SET NULL: seta o FK para NULL (exige allowNull: true)
      // SET DEFAULT: seta para o valor default do FK
      // NO ACTION: igual ao RESTRICT na prática (adiado dependendo do banco)
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    // FK para CLIENTES
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "clientes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    // FK para USUARIOS
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    status: {
      type: DataTypes.ENUM("NEGOCIACAO", "CANCELADA", "CONCLUIDA"),
      allowNull: false,
      defaultValue: "NEGOCIACAO",
    },
    preco_final: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
    },
    excluido_em: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "vendas",
  },
);
```

### 3.5) PagamentoVenda

```js
import { DataTypes } from "sequelize";
import { sequelize } from "../../database/sequelize.js";

export const PagamentoVenda = sequelize.define(
  "PagamentoVenda",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // FK para VENDAS
    venda_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vendas",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    metodo: {
      type: DataTypes.ENUM(
        "PIX",
        "DINHEIRO",
        "CARTAO",
        "TRANSFERENCIA",
        "FINANCIAMENTO",
      ),
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    pago_em: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
    },
    excluido_em: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "pagamentos_venda",
    createdAt: "criado_em",
    updatedAt: "atualizado_em",
    deletedAt: "excluido_em",
    paranoid: true,
  },
);
```

---

## 4) Associações

Crie um arquivo único de associações, por exemplo `src/database/associations.js`:

```js
// Relacionamentos (associações) no Sequelize
// Tipos principais:
// - hasMany: 1:N (um usuário tem muitas vendas)
// - belongsTo: N:1 (uma venda pertence a um usuário)
// - hasOne: 1:1
// - belongsToMany: N:N (usa tabela de junção)

import { Usuario } from "../modulos/usuario/model/Usuario.js";
import { Cliente } from "../modulos/cliente/model/Cliente.js";
import { Veiculo } from "../modulos/veiculo/model/Veiculo.js";
import { Venda } from "../modulos/venda/model/Venda.js";
import { PagamentoVenda } from "../modulos/venda/model/PagamentoVenda.js";

// Usuario (1) -> (N) Venda
Usuario.hasMany(Venda, { foreignKey: "usuario_id" });
Venda.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Cliente (1) -> (N) Venda
Cliente.hasMany(Venda, { foreignKey: "cliente_id" });
Venda.belongsTo(Cliente, { foreignKey: "cliente_id" });

// Veiculo (1) -> (N) Venda
Veiculo.hasMany(Venda, { foreignKey: "veiculo_id" });
Venda.belongsTo(Veiculo, { foreignKey: "veiculo_id" });

// Venda (1) -> (N) PagamentoVenda
Venda.hasMany(PagamentoVenda, { foreignKey: "venda_id" });
PagamentoVenda.belongsTo(Venda, { foreignKey: "venda_id" });
```

---

## 5) Inicialização e sync

Exemplo de bootstrap (pode ficar no `src/server.js`):

```js
import { sequelize } from "./database/sequelize.js";
import "./database/associations.js";

// sincronia do schema
await sequelize.sync({ force: true, alter: true });
```

> **Atenção:** `force: true` apaga tudo e recria. Use somente em desenvolvimento.

---

## 6) Regras de negócio (mesma ideia do projeto atual)

As validações acima são **de dados**. As regras de negócio continuam no serviço/controller, por exemplo:

- bloquear atualização de veículo com status `RESERVADO` ou `VENDIDO`;
- evitar concluir venda já concluída;
- impedir apagar venda concluída;
- etc.

---

## 7) Resumo das validações aplicadas

- `Usuario`: nome, email, perfil, senha_hash obrigatórios, email válido, perfil dentro dos valores permitidos.
- `Cliente`: nome e documento obrigatórios, email válido se informado.
- `Veiculo`: vin único, ano_modelo dentro do intervalo, km >= 0, preços >= 0, status permitido.
- `Venda`: status permitido, preco_final >= 0, relacionamentos obrigatórios.
- `PagamentoVenda`: metodo permitido, valor >= 0, venda_id obrigatório.

---

## 8) Próximos passos (quando migrações entrarem)

- Remover `force/alter`.
- Criar migrations com `sequelize-cli`.
- Versionar o schema e os seeds.

---

Se quiser, eu também preparo os arquivos reais do projeto já migrados para Sequelize.
