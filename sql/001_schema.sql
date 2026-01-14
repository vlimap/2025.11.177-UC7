-- Schema mínimo para concessionária
-- Sem ORM: as constraints aqui são parte importante da qualidade do projeto.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USUÁRIOS (funcionários)
CREATE TABLE
  IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    perfil TEXT NOT NULL DEFAULT 'user',
    senha_hash TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now (),
    CONSTRAINT usuarios_perfil_chk CHECK (perfil IN ('admin', 'user'))
  );

-- CLIENTES (compradores)
CREATE TABLE
  IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    nome TEXT NOT NULL,
    documento TEXT NOT NULL UNIQUE,
    email TEXT,
    telefone TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now ()
  );

-- VEÍCULOS (estoque)
CREATE TABLE
  IF NOT EXISTS veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    vin TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano_modelo INT NOT NULL,
    cor TEXT NOT NULL,
    km INT NOT NULL DEFAULT 0,
    preco_compra NUMERIC(12, 2) NOT NULL,
    preco_venda NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISPONIVEL',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now (),
    CONSTRAINT veiculos_status_chk CHECK (
      status IN ('DISPONIVEL', 'RESERVADO', 'VENDIDO', 'INATIVO')
    )
  );

CREATE INDEX IF NOT EXISTS veiculos_marca_modelo_idx ON veiculos (marca, modelo);

-- VENDAS (negociação/venda)
CREATE TABLE
  IF NOT EXISTS vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    veiculo_id UUID NOT NULL REFERENCES veiculos (id),
    cliente_id UUID NOT NULL REFERENCES clientes (id),
    usuario_id UUID NOT NULL REFERENCES usuarios (id),
    status TEXT NOT NULL DEFAULT 'NEGOCIACAO',
    preco_final NUMERIC(12, 2) NOT NULL,
    criada_em TIMESTAMPTZ NOT NULL DEFAULT now (),
    CONSTRAINT vendas_status_chk CHECK (
      status IN ('NEGOCIACAO', 'CANCELADA', 'CONCLUIDA')
    )
  );

CREATE INDEX IF NOT EXISTS vendas_veiculo_idx ON vendas (veiculo_id);

CREATE INDEX IF NOT EXISTS vendas_cliente_idx ON vendas (cliente_id);

CREATE INDEX IF NOT EXISTS vendas_usuario_idx ON vendas (usuario_id);

-- PAGAMENTOS DA VENDA
CREATE TABLE
  IF NOT EXISTS pagamentos_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    venda_id UUID NOT NULL REFERENCES vendas (id) ON DELETE CASCADE,
    metodo TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    pago_em TIMESTAMPTZ,
    CONSTRAINT pagamentos_metodo_chk CHECK (
      metodo IN (
        'PIX',
        'DINHEIRO',
        'CARTAO',
        'TRANSFERENCIA',
        'FINANCIAMENTO'
      )
    )
  );

CREATE INDEX IF NOT EXISTS pagamentos_venda_id_idx ON pagamentos_venda (venda_id);