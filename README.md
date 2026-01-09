# Desafio Backend — API de Concessionária (Express + PostgreSQL + JWT, sem ORM)

Este repositório é um tutorial organizado (para iniciantes) inspirado no projeto anterior de **API de Usuários com JWT**. Aqui o código está organizado por **domínio** em `src/modulos/` (cada domínio tem `model/`, `controller/` e `route/`), além de `middlewares/` com **bcrypt** e **jsonwebtoken**.  
A diferença é que, agora, o “banco em memória (array)” foi substituído por **PostgreSQL** usando **queries SQL com `pg`** .

---

## 1. Contexto do desafio (como em uma vaga de Backend)

Você entrou em um time que atende uma concessionária. Hoje o controle de **estoque**, **clientes** e **vendas** acontece em planilhas e mensagens. O resultado são inconsistências e retrabalho:

- Veículo “reservado” por mais de um vendedor ao mesmo tempo
- Clientes duplicados (CPF/CNPJ em registros diferentes)
- Histórico incompleto de quem fez a venda e por qual valor
- Acesso sem controle: qualquer pessoa com o link consegue chamar endpoints críticos

### Objetivo do desafio
Criar uma API REST para uma concessionária, com:

1) **Autenticação JWT** (login retorna token; rotas privadas exigem token)  
2) **Persistência em PostgreSQL** (tabelas e relacionamentos bem definidos)  
3) **Regras mínimas de negócio**:
   - Um veículo não pode ser vendido duas vezes
   - Um cliente não pode ser cadastrado duas vezes com o mesmo documento
   - Apenas usuários autenticados acessam rotas de estoque/vendas

### Critérios de avaliação (o que normalmente é observado em uma vaga)
- Organização do projeto (diretórios, nomes, separação de responsabilidades)
- Segurança básica (hash de senha, JWT, queries parametrizadas)
- Qualidade do SQL (constraints e relacionamentos)
- Tratamento de erros e status codes coerentes
- Clareza de setup e possibilidade de rodar localmente

---

## 2. Stack (sem ORM)

- Node.js 18+ (recomendado 20+)
- Express
- PostgreSQL
- `pg` (node-postgres) para executar SQL
- `bcryptjs` para hash de senha
- `jsonwebtoken` para gerar/validar JWT
- `dotenv` para variáveis de ambiente
- `uuid` para IDs

---

## 3. Estrutura de diretórios (organizada por domínio)

```
dealership-api/
├── sql/
│   ├── 001_schema.sql
│   └── 002_seed.sql
├── src/
│   ├── server.js
│   ├── database/
│   │   └── db.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   └── modulos/
│       ├── usuario/
│       │   ├── model/
│       │   ├── controller/
│       │   └── route/
│       ├── cliente/
│       │   ├── model/
│       │   ├── controller/
│       │   └── route/
│       ├── veiculo/
│       │   ├── model/
│       │   ├── controller/
│       │   └── route/
│       └── venda/
│           ├── model/
│           ├── controller/
│           └── route/
├── .env
├── .env.example
├── package.json
└── README.md
```

### Por que essa estrutura?
- `src/modulos/<dominio>/route/` define URLs e middlewares (roteamento)
- `src/modulos/<dominio>/controller/` valida entrada e monta resposta HTTP
- `src/modulos/<dominio>/model/` executa queries SQL (camada de acesso a dados)
- `middlewares/` concentra autenticação (JWT)
- `database/` centraliza conexão com PostgreSQL
- `sql/` versiona o schema e seeds iniciais (sem ferramenta de migration)

---

## 4. Modelagem de dados (tabelas e relacionamentos)

Abaixo está o conjunto mínimo de tabelas para suportar estoque e vendas.

### 4.1. Diagrama (texto)

- `usuarios` (usuários do sistema / funcionários)
  - 1:N com `vendas` (um usuário pode registrar várias vendas)

- `clientes` (compradores)
  - 1:N com `vendas` (um cliente pode ter várias compras)

- `veiculos` (estoque)
  - 1:N com `vendas` (histórico)
  - Regra de negócio: um veículo só pode estar “vendido” uma vez (controlado por `status`)

- `vendas` (negociação/venda)
  - N:1 com `usuarios` (vendedor responsável)
  - N:1 com `clientes`
  - N:1 com `veiculos`
  - 1:N com `pagamentos_venda`

- `pagamentos_venda` (lançamentos de pagamento)
  - N:1 com `vendas`

### 4.2. O que cada tabela representa

#### A) `usuarios`
Funcionários que acessam o sistema (vendedores/gerentes/admin).  
Usada no login e como referência de “quem registrou a venda”.

Campos relevantes:
- `id` (UUID, PK)
- `nome`
- `email` (UNIQUE)
- `senha_hash` (hash do bcrypt)
- `criado_em`

#### B) `clientes`
Compradores. Deve evitar duplicidade por documento.

Campos relevantes:
- `id` (UUID, PK)
- `nome`
- `documento` (UNIQUE, armazenar sem máscara)
- `email`, `telefone` (opcionais)
- `criado_em`

#### C) `veiculos`
Estoque da concessionária. VIN/chassi deve ser único.

Campos relevantes:
- `id` (UUID, PK)
- `vin` (UNIQUE)
- `marca`, `modelo`, `ano_modelo`
- `cor`, `km`
- `preco_compra`, `preco_venda`
- `status` (controle de disponibilidade)
  - `DISPONIVEL`, `RESERVADO`, `VENDIDO`, `INATIVO`

#### D) `vendas`
Representa a proposta/negociação e a venda efetiva.

Campos relevantes:
- `id` (UUID, PK)
- `veiculo_id` (FK)
- `cliente_id` (FK)
- `usuario_id` (FK)
- `status`
  - `NEGOCIACAO`, `CANCELADA`, `CONCLUIDA`
- `preco_final`
- `criada_em`

#### E) `pagamentos_venda`
Registra pagamentos (um ou vários) associados a uma venda.

Campos relevantes:
- `id` (UUID, PK)
- `venda_id` (FK)
- `metodo` (`PIX`, `DINHEIRO`, `CARTAO`, `TRANSFERENCIA`, `FINANCIAMENTO`)
- `valor`
- `pago_em` (opcional)

---

## 5. SQL do banco (sem ORM)

### 5.1. Criar banco e rodar scripts

1) Crie o banco (exemplo):
```sql
CREATE DATABASE dealership;
```

2) Rode o schema:
```bash
psql -d dealership -f sql/001_schema.sql
```

3) (Opcional) Rode seed (ex.: usuário inicial):
```bash
psql -d dealership -f sql/002_seed.sql
```

> No Windows, é comum instalar o PostgreSQL com o `psql` no PATH. Se não estiver, execute pelo “SQL Shell (psql)” ou ajuste o PATH.

---

## 6. Setup do projeto (Windows 11)

### 6.1. Instalar dependências
```bash
npm install
```

### 6.2. Configurar `.env`
Crie `.env` a partir de `.env.example`:

```bash
copy .env.example .env
```

`.env.example`:
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dealership
JWT_SECRET=meusegredoseguro
JWT_EXPIRES_IN=1h
```

### 6.3. Rodar em desenvolvimento
```bash
npm run dev
```

Servidor: `http://localhost:3000`

---

## 7. Endpoints (mantendo o estilo do tutorial original)

### 7.1. Autenticação (base `/usuarios`)

- `POST /usuarios/cadastro`
- `POST /usuarios/login`
- `GET /usuarios/perfil` (protegida: exige JWT)

CRUD de usuários (protegido):
- `GET /usuarios` (listar usuários)
- `GET /usuarios/:id` (buscar usuário)
- `PUT /usuarios/:id` (atualizar usuário)
- `DELETE /usuarios/:id` (remover usuário)

### 7.2. Recursos da concessionária (protegidos)

- `POST /clientes` (criar cliente)
- `GET /clientes` (listar clientes)

- `GET /clientes/:id` (buscar cliente)
- `PUT /clientes/:id` (atualizar cliente)
- `DELETE /clientes/:id` (remover cliente)

- `POST /veiculos` (criar veículo no estoque)
- `GET /veiculos` (listar veículos)

- `GET /veiculos/:id` (buscar veículo)
- `PUT /veiculos/:id` (atualizar veículo)
- `DELETE /veiculos/:id` (inativar veículo — soft delete)

- `POST /vendas` (abrir venda/negociação)
- `GET /vendas` (listar vendas)
- `GET /vendas/:id` (detalhar venda + pagamentos)
- `PUT /vendas/:id` (editar `preco_final` em `NEGOCIACAO`)
- `PATCH /vendas/:id/concluir` (concluir venda)
- `PATCH /vendas/:id/cancelar` (cancelar venda)
- `POST /vendas/:id/pagamentos` (registrar pagamento)
- `DELETE /vendas/:id` (remover venda — apenas `CANCELADA` e sem pagamentos)

---

## 8. Testando (PowerShell + curl.exe)

No PowerShell, use `curl.exe` (evita o alias do PowerShell).

### 8.1. Cadastro de usuário
```bash
curl.exe -X POST http://localhost:3000/usuarios/cadastro ^
  -H "Content-Type: application/json" ^
  -d "{\"nome\":\"Joel Santos\",\"email\":\"joel@email.com\",\"senha\":\"123456\"}"
```

### 8.2. Login (pegar token)
```bash
curl.exe -X POST http://localhost:3000/usuarios/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"joel@email.com\",\"senha\":\"123456\"}"
```

### 8.3. Acessar rota protegida
```bash
curl.exe http://localhost:3000/usuarios/perfil ^
  -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
```

---

## 9. Arquivos do projeto (copie e cole)

A seguir estão os arquivos essenciais para rodar o projeto.

---

### `package.json`

```json
{
  "name": "dealership-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}
```

---

## 9.1. Banco (SQL)

### `sql/001_schema.sql`

```sql
-- Schema mínimo para concessionária
-- Sem ORM: as constraints aqui são parte importante da qualidade do projeto.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USUÁRIOS (funcionários)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLIENTES (compradores)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  documento TEXT NOT NULL UNIQUE,
  email TEXT,
  telefone TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VEÍCULOS (estoque)
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano_modelo INT NOT NULL,
  cor TEXT NOT NULL,
  km INT NOT NULL DEFAULT 0,
  preco_compra NUMERIC(12,2) NOT NULL,
  preco_venda NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISPONIVEL',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT veiculos_status_chk
    CHECK (status IN ('DISPONIVEL','RESERVADO','VENDIDO','INATIVO'))
);

CREATE INDEX IF NOT EXISTS veiculos_marca_modelo_idx ON veiculos (marca, modelo);

-- VENDAS (negociação/venda)
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  status TEXT NOT NULL DEFAULT 'NEGOCIACAO',
  preco_final NUMERIC(12,2) NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vendas_status_chk
    CHECK (status IN ('NEGOCIACAO','CANCELADA','CONCLUIDA'))
);

CREATE INDEX IF NOT EXISTS vendas_veiculo_idx ON vendas (veiculo_id);
CREATE INDEX IF NOT EXISTS vendas_cliente_idx ON vendas (cliente_id);
CREATE INDEX IF NOT EXISTS vendas_usuario_idx ON vendas (usuario_id);

-- PAGAMENTOS DA VENDA
CREATE TABLE IF NOT EXISTS pagamentos_venda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  pago_em TIMESTAMPTZ,

  CONSTRAINT pagamentos_metodo_chk
    CHECK (metodo IN ('PIX','DINHEIRO','CARTAO','TRANSFERENCIA','FINANCIAMENTO'))
);

CREATE INDEX IF NOT EXISTS pagamentos_venda_id_idx ON pagamentos_venda (venda_id);
```

### `sql/002_seed.sql` (opcional)

```sql
-- Seed opcional: crie um usuário inicial manualmente
-- Observação: a senha aqui deve estar com hash, então o recomendado é criar via endpoint /usuarios/cadastro.
-- Este arquivo fica como exemplo de seed (por exemplo, dados de teste).

-- Exemplo de veículo inicial:
INSERT INTO veiculos (vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status)
VALUES ('9BWZZZ377VT004251', 'Volkswagen', 'Golf', 2020, 'Preto', 45000, 65000.00, 79900.00, 'DISPONIVEL')
ON CONFLICT (vin) DO NOTHING;
```

---

## 9.2. Conexão com o PostgreSQL

### `src/database/db.js`

```js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada no .env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Helper: executar query (mantém padrão único)
export async function query(text, params) {
  return pool.query(text, params);
}
```

---

## 9.3. Middleware de autenticação (JWT)

### `src/middlewares/authMiddleware.js`

```js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario;
    return next();
  } catch (erro) {
    return res.status(403).json({ erro: "Token inválido ou expirado" });
  }
}
```

---

## 9.4. Model (SQL) + Controller + Routes — Usuários (autenticação)

### `src/modulos/usuario/model/UsuarioModel.js`

```js
import { query } from "../../../database/db.js";
import bcrypt from "bcryptjs";

export default class UsuarioModel {
  static async buscarPorEmail(email) {
    const result = await query("SELECT * FROM usuarios WHERE email = $1", [email]);
    return result.rows[0] ?? null;
  }

  static async criar({ nome, email, senha }) {
    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome, email, senhaHash]
    );

    return result.rows[0];
  }
}
```

### `src/modulos/usuario/controller/UsuarioController.js`

```js
import UsuarioModel from "../model/UsuarioModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export default class UsuarioController {
  static async cadastrar(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
      }

      const existente = await UsuarioModel.buscarPorEmail(email);
      if (existente) {
        return res.status(400).json({ erro: "E-mail já cadastrado!" });
      }

      const novoUsuario = await UsuarioModel.criar({ nome, email, senha });
      return res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: novoUsuario });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ erro: "email e senha são obrigatórios" });
      }

      const usuario = await UsuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta" });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN ?? "1h" }
      );

      return res.json({ mensagem: "Login bem-sucedido!", token });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }

  static perfil(req, res) {
    return res.json({
      mensagem: "Acesso autorizado!",
      usuario: req.usuario
    });
  }
}
```

### `src/modulos/usuario/route/usuarioRoutes.js`

```js
import express from "express";
import UsuarioController from "../controller/UsuarioController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/cadastro", UsuarioController.cadastrar);
router.post("/login", UsuarioController.login);

router.use(autenticarToken);
router.get("/perfil", UsuarioController.perfil);

export default router;
```

---

## 9.5. Model + Controller + Routes — Clientes

### `src/modulos/cliente/model/ClienteModel.js`

```js
import { query } from "../../../database/db.js";

export default class ClienteModel {
  static async listar() {
    const result = await query(
      "SELECT id, nome, documento, email, telefone, criado_em FROM clientes ORDER BY criado_em DESC",
      []
    );
    return result.rows;
  }

  static async criar({ nome, documento, email, telefone }) {
    const result = await query(
      `INSERT INTO clientes (nome, documento, email, telefone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, documento, email, telefone, criado_em`,
      [nome, documento, email ?? null, telefone ?? null]
    );
    return result.rows[0];
  }
}
```

### `src/modulos/cliente/controller/ClienteController.js`

```js
import ClienteModel from "../model/ClienteModel.js";

export default class ClienteController {
  static async criar(req, res) {
    try {
      const { nome, documento, email, telefone } = req.body;

      if (!nome || !documento) {
        return res.status(400).json({ erro: "nome e documento são obrigatórios" });
      }

      const cliente = await ClienteModel.criar({ nome, documento, email, telefone });
      return res.status(201).json({ mensagem: "Cliente criado com sucesso!", cliente });
    } catch (erro) {
      // Duplicidade de documento cai aqui (UNIQUE)
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      const clientes = await ClienteModel.listar();
      return res.json({ clientes });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }
}
```

### `src/modulos/cliente/route/clienteRoutes.js`

```js
import express from "express";
import ClienteController from "../controller/ClienteController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);
router.post("/", ClienteController.criar);
router.get("/", ClienteController.listar);

export default router;
```

---

## 9.6. Model + Controller + Routes — Veículos (estoque)

### `src/modulos/veiculo/model/VeiculoModel.js`

```js
import { query } from "../../../database/db.js";

export default class VeiculoModel {
  static async listar() {
    const result = await query(
      `SELECT id, vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status, criado_em
       FROM veiculos
       ORDER BY criado_em DESC`,
      []
    );
    return result.rows;
  }

  static async criar(dados) {
    const {
      vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status
    } = dados;

    const result = await query(
      `INSERT INTO veiculos (vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status, criado_em`,
      [vin, marca, modelo, ano_modelo, cor, km ?? 0, preco_compra, preco_venda, status ?? "DISPONIVEL"]
    );
    return result.rows[0];
  }
}
```

### `src/modulos/veiculo/controller/VeiculoController.js`

```js
import VeiculoModel from "../model/VeiculoModel.js";

export default class VeiculoController {
  static async criar(req, res) {
    try {
      const { vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda } = req.body;

      if (!vin || !marca || !modelo || !ano_modelo || !cor || preco_compra == null || preco_venda == null) {
        return res.status(400).json({ erro: "Campos obrigatórios: vin, marca, modelo, ano_modelo, cor, preco_compra, preco_venda" });
      }

      const veiculo = await VeiculoModel.criar({ vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda });
      return res.status(201).json({ mensagem: "Veículo cadastrado no estoque!", veiculo });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async listar(req, res) {
    try {
      const veiculos = await VeiculoModel.listar();
      return res.json({ veiculos });
    } catch (erro) {
      return res.status(500).json({ erro: erro.message });
    }
  }
}
```

### `src/modulos/veiculo/route/veiculoRoutes.js`

```js
import express from "express";
import VeiculoController from "../controller/VeiculoController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);
router.post("/", VeiculoController.criar);
router.get("/", VeiculoController.listar);

export default router;
```

---

## 9.7. Vendas (com regra: veículo não pode ser vendido duas vezes)

Nesta versão, a regra é aplicada assim:
- Abrir venda (`/vendas`): só permite se veículo estiver `DISPONIVEL`; ao criar venda, altera veículo para `RESERVADO`.
- Concluir (`/vendas/:id/concluir`): marca venda `CONCLUIDA` e veículo `VENDIDO`.
- Cancelar (`/vendas/:id/cancelar`): marca venda `CANCELADA` e devolve veículo para `DISPONIVEL`.

Para evitar condições de corrida, usamos **transação SQL**.

### `src/modulos/venda/model/VendaModel.js`

```js
import { pool } from "../../../database/db.js";

export default class VendaModel {
  static async criarVenda({ veiculo_id, cliente_id, usuario_id, preco_final }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1) Verifica status do veículo
      const v = await client.query("SELECT status FROM veiculos WHERE id = $1 FOR UPDATE", [veiculo_id]);
      if (!v.rows[0]) throw new Error("Veículo não encontrado");
      if (v.rows[0].status !== "DISPONIVEL") throw new Error("Veículo não está disponível para venda");

      // 2) Marca veículo como RESERVADO
      await client.query("UPDATE veiculos SET status = 'RESERVADO' WHERE id = $1", [veiculo_id]);

      // 3) Cria venda
      const venda = await client.query(
        `INSERT INTO vendas (veiculo_id, cliente_id, usuario_id, status, preco_final)
         VALUES ($1, $2, $3, 'NEGOCIACAO', $4)
         RETURNING id, veiculo_id, cliente_id, usuario_id, status, preco_final, criada_em`,
        [veiculo_id, cliente_id, usuario_id, preco_final]
      );

      await client.query("COMMIT");
      return venda.rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async concluirVenda(venda_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query("SELECT id, veiculo_id, status FROM vendas WHERE id = $1 FOR UPDATE", [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda já está concluída");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda cancelada não pode ser concluída");

      await client.query("UPDATE vendas SET status = 'CONCLUIDA' WHERE id = $1", [venda_id]);
      await client.query("UPDATE veiculos SET status = 'VENDIDO' WHERE id = $1", [venda.rows[0].veiculo_id]);

      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async cancelarVenda(venda_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const venda = await client.query("SELECT id, veiculo_id, status FROM vendas WHERE id = $1 FOR UPDATE", [venda_id]);
      if (!venda.rows[0]) throw new Error("Venda não encontrada");
      if (venda.rows[0].status === "CANCELADA") throw new Error("Venda já está cancelada");
      if (venda.rows[0].status === "CONCLUIDA") throw new Error("Venda concluída não pode ser cancelada");

      await client.query("UPDATE vendas SET status = 'CANCELADA' WHERE id = $1", [venda_id]);
      await client.query("UPDATE veiculos SET status = 'DISPONIVEL' WHERE id = $1", [venda.rows[0].veiculo_id]);

      await client.query("COMMIT");
      return true;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  static async adicionarPagamento({ venda_id, metodo, valor, pago_em }) {
    const result = await pool.query(
      `INSERT INTO pagamentos_venda (venda_id, metodo, valor, pago_em)
       VALUES ($1, $2, $3, $4)
       RETURNING id, venda_id, metodo, valor, pago_em`,
      [venda_id, metodo, valor, pago_em ?? null]
    );

    return result.rows[0];
  }
}
```

### `src/modulos/venda/controller/VendaController.js`

```js
import VendaModel from "../model/VendaModel.js";

export default class VendaController {
  static async criar(req, res) {
    try {
      const { veiculo_id, cliente_id, preco_final } = req.body;

      if (!veiculo_id || !cliente_id || preco_final == null) {
        return res.status(400).json({ erro: "veiculo_id, cliente_id e preco_final são obrigatórios" });
      }

      const venda = await VendaModel.criarVenda({
        veiculo_id,
        cliente_id,
        usuario_id: req.usuario.id,
        preco_final
      });

      return res.status(201).json({ mensagem: "Venda criada (negociação iniciada).", venda });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async concluir(req, res) {
    try {
      await VendaModel.concluirVenda(req.params.id);
      return res.json({ mensagem: "Venda concluída com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async cancelar(req, res) {
    try {
      await VendaModel.cancelarVenda(req.params.id);
      return res.json({ mensagem: "Venda cancelada com sucesso!" });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }

  static async pagamento(req, res) {
    try {
      const { metodo, valor, pago_em } = req.body;

      if (!metodo || valor == null) {
        return res.status(400).json({ erro: "metodo e valor são obrigatórios" });
      }

      const pagamento = await VendaModel.adicionarPagamento({
        venda_id: req.params.id,
        metodo,
        valor,
        pago_em
      });

      return res.status(201).json({ mensagem: "Pagamento registrado!", pagamento });
    } catch (erro) {
      return res.status(400).json({ erro: erro.message });
    }
  }
}
```

### `src/modulos/venda/route/vendaRoutes.js`

```js
import express from "express";
import VendaController from "../controller/VendaController.js";
import { autenticarToken } from "../../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(autenticarToken);

router.post("/", VendaController.criar);
router.patch("/:id/concluir", VendaController.concluir);
router.patch("/:id/cancelar", VendaController.cancelar);
router.post("/:id/pagamentos", VendaController.pagamento);

export default router;
```

---

## 9.8. Servidor (server.js) e registro das rotas

### `src/server.js`

```js
import express from "express";
import dotenv from "dotenv";

import usuarioRoutes from "./modulos/usuario/route/usuarioRoutes.js";
import clienteRoutes from "./modulos/cliente/route/clienteRoutes.js";
import veiculoRoutes from "./modulos/veiculo/route/veiculoRoutes.js";
import vendaRoutes from "./modulos/venda/route/vendaRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/usuarios", usuarioRoutes);
app.use("/clientes", clienteRoutes);
app.use("/veiculos", veiculoRoutes);
app.use("/vendas", vendaRoutes);

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
});
```

---

## 10. Dicas importantes para iniciantes (aplicadas aqui)

- JWT cria APIs stateless: cada request leva o token; não há sessão no servidor.
- bcrypt protege senhas: armazene apenas `senha_hash`.
- Use sempre **queries parametrizadas** (`$1`, `$2`, ...) para evitar SQL injection.
- Regras de estoque/venda devem usar **transações** quando houver mais de um UPDATE/INSERT dependente.

---

## 11. Próximas melhorias (para evolução)

- Tratar erros de UNIQUE (`email`, `documento`, `vin`) com mensagens específicas (sem vazar detalhes internos)
- Melhorar listagem de vendas (paginação/filtros)
- Padronizar validações e erros (ex.: camada de validator)
- Adicionar testes de integração (Supertest) e testes com banco local
- Criar um script de migration incremental (ou adotar ferramenta de migrations sem ORM)

---
