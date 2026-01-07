-- Seed opcional: crie um usuário inicial manualmente
-- Observação: a senha aqui deve estar com hash, então o recomendado é criar via endpoint /usuarios/cadastro.
-- Este arquivo fica como exemplo de seed (por exemplo, dados de teste).

-- Exemplo de veículo inicial:
INSERT INTO veiculos (vin, marca, modelo, ano_modelo, cor, km, preco_compra, preco_venda, status)
VALUES ('9BWZZZ377VT004251', 'Volkswagen', 'Golf', 2020, 'Preto', 45000, 65000.00, 79900.00, 'DISPONIVEL')
ON CONFLICT (vin) DO NOTHING;
