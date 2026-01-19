# Atividade 02 — Usuário "Cliente" (CRUD) + Compra de Veículo

## Contexto (o que já existe no projeto)
Este projeto já tem:
- Autenticação via JWT em `src/middlewares/authMiddleware.js`.
- Tabela `usuarios` com coluna `perfil` e `CHECK (perfil IN ('admin','seller','cliente'))` em `sql/001_schema.sql`.
- Tabela `clientes` (compradores) separada de `usuarios`.
- Vendas em `vendas` exigindo **três vínculos**: `veiculo_id` (estoque), `cliente_id` (comprador) e `usuario_id` (vem do token em `req.usuario.id`).
- Rotas por domínio em `src/modulos/<dominio>/{route,controller,model}`.

Hoje, o endpoint `POST /vendas` exige `cliente_id` no body e usa `req.usuario.id` como `usuario_id`.

## Objetivo da atividade
Criar **um novo tipo de usuário do sistema**: o **usuário cliente**.

Requisitos:
1) O usuário cliente deve ter **CRUD completo** (criar, ler, atualizar, deletar).
2) O usuário cliente deve conseguir **comprar um carro**, usando o fluxo de venda existente (negociação → pagamento → conclusão), respeitando as regras do projeto.
3) Não pode haver “cliente sem usuário” para o fluxo de compra do usuário cliente: precisa existir uma forma consistente de descobrir o `cliente_id` associado ao usuário logado.

> Importante: entregue a implementação seguindo o padrão do repositório (model/controller/route) e mantendo SQL parametrizado.

---

## Parte A — Modelagem: ligar `usuarios (perfil=cliente)` com `clientes`

### A1) Problema a resolver
A venda exige `cliente_id` (tabela `clientes`), mas o login gera token com dados de `usuarios`.
Sem um vínculo entre essas tabelas, o usuário cliente não tem como, de forma segura, saber qual `cliente_id` usar na compra.

### A2) Solução esperada (1:1)
Crie um relacionamento **1 para 1** entre:
- `usuarios` (somente os de `perfil = 'cliente'`)
- `clientes`

Sugestão de implementação (escolha uma e siga até o fim):
- Opção 1 (recomendada): adicionar `usuario_id` em `clientes` (UUID), com `UNIQUE` e `FK` para `usuarios(id)`.
- Opção 2: criar uma tabela de ligação (ex.: `clientes_usuarios`) com chaves únicas.

### A3) Critérios de aceite da modelagem
- Para cada usuário com `perfil='cliente'` existe **exatamente um** registro em `clientes` ligado a ele.
- Não é possível ligar o mesmo usuário a dois clientes.
- Ao remover a conta do usuário cliente, o vínculo não pode ficar “órfão” (defina a estratégia: cascade, soft-delete, bloqueio, etc.).

---

## Parte B — Cadastro e CRUD do usuário cliente

### B1) Onde implementar
Você pode:
- Estender o módulo `usuario` para contemplar o fluxo de “conta cliente”, **ou**
- Criar um novo módulo dedicado (ex.: `src/modulos/clienteUsuario/`) mantendo o padrão `route/controller/model`.

Escolha a alternativa que deixe as responsabilidades mais claras:
- `usuarios`: autenticação, conta e perfis.
- `clientes`: dados do comprador.

### B2) Operações obrigatórias (CRUD)
Implemente as operações abaixo para o **usuário cliente**:

1) **Create (criar conta cliente)**
- Deve criar o registro em `usuarios` com `perfil='cliente'`.
- Deve criar (no mesmo fluxo) o registro em `clientes` associado ao usuário.
- Deve validar duplicidade (e-mail em `usuarios`, documento em `clientes`).
- Deve ser atômico: se uma parte falhar, nada pode ficar parcialmente gravado.

2) **Read (ler dados)**
- O usuário cliente logado deve conseguir obter:
  - seus dados de usuário (ex.: id, nome, email, perfil)
  - e seus dados de cliente (ex.: id do cliente, documento, telefone, etc.)

3) **Update (atualizar conta)**
- O usuário cliente deve conseguir atualizar seus dados.
- Defina claramente o que é editável em `usuarios` e o que é editável em `clientes`.
- Atualizações devem respeitar as constraints de unicidade (e-mail/documento).

4) **Delete (excluir conta)**
- O usuário cliente deve conseguir remover sua própria conta.
- Defina e implemente a regra para dependências:
  - Se existir venda vinculada ao cliente, o que acontece? (bloqueia? permite? exige cancelamento?)

### B3) Regras de autorização (perfis)
- Rotas de “conta cliente” devem ser acessíveis ao próprio cliente autenticado.
- Rotas administrativas (ex.: listar todos os usuários) devem continuar restritas.

Atenção: revise o middleware `src/middlewares/autorizationMiddleware.js` e garanta que ele realmente valide perfis permitidos.

---

## Parte C — Compra de veículo pelo usuário cliente

### C1) O que significa “comprar” neste projeto
O projeto já tem regras no Model de venda:
- Ao abrir venda, o veículo muda de `DISPONIVEL` para `RESERVADO`.
- Ao concluir, o veículo vira `VENDIDO`.
- Ao cancelar, o veículo volta para `DISPONIVEL`.

### C2) Requisito: o cliente não escolhe `cliente_id` manualmente
No fluxo do usuário cliente, o `cliente_id` deve ser derivado do usuário logado.

Você deve adaptar o fluxo para que:
- Quando `req.usuario.perfil === 'cliente'`, o backend determine automaticamente o `cliente_id` associado.
- Um usuário cliente não pode comprar “em nome de outro cliente”.

### C3) O que precisa funcionar (mínimo)
Para um usuário cliente autenticado:
1) Listar veículos disponíveis (para escolher um).
2) Abrir uma venda/negociação para si.
3) Registrar pelo menos um pagamento.
4) Concluir a venda.

### C4) Regras de acesso recomendadas
Defina o comportamento por perfil:
- **cliente**:
  - pode criar venda para si
  - pode ver apenas suas próprias vendas (lista e detalhe)
  - pode (ou não) concluir/cancelar a própria venda — documente a decisão
- **seller/admin**:
  - pode operar vendas normalmente (como já existe)

---

## Parte D — Checklist de endpoints (sem código)

Implemente endpoints suficientes para cobrir:

1) Conta do cliente (usuário + cliente vinculado)
- Criar conta (público)
- Login (público — pode reutilizar o já existente)
- Obter “meu perfil completo” (privado)
- Atualizar “meu perfil completo” (privado)
- Excluir “minha conta” (privado)

2) Compra
- Listar veículos (privado)
- Criar venda no modo cliente (privado)
- Listar/minhas vendas (privado)
- Detalhar/minha venda (privado)
- Registrar pagamento (privado)
- Concluir (privado)

> Dica: você pode manter as rotas existentes e criar variações específicas para o cliente (ex.: “minhas vendas”), ou adaptar as atuais para respeitar o perfil.

---

## Parte E — Cenários de teste (roteiro no Insomnia)

Use a coleção `insomnia-collection.json` e o ambiente que já possui `token_cliente`.

1) Criar usuário cliente
- Cadastre um usuário com `perfil='cliente'` e os dados necessários para criar também o registro em `clientes`.

2) Login como cliente
- Faça login e salve o token como `token_cliente`.

3) Buscar dados do cliente logado
- Chame o endpoint de “meu perfil completo” e valide que ele retorna também o `cliente_id` associado.

4) Comprar um veículo
- Liste veículos e selecione um com status `DISPONIVEL`.
- Abra uma venda para si (sem informar `cliente_id` manualmente, se esse for o seu design).
- Registre um pagamento.
- Conclua a venda.

5) Regras de segurança
- Tente criar venda informando `cliente_id` de outra pessoa (deve falhar).
- Tente ver venda de outro cliente (deve falhar).

---

## Entregáveis
- Alterações necessárias em `sql/001_schema.sql` (e qualquer ajuste de seed, se aplicável).
- Alterações/novos arquivos em `src/modulos/` seguindo o padrão do projeto.
- Ajustes em middlewares (se necessário) para suportar perfis.
- Atualização (ou complementação) da coleção do Insomnia com:
  - requests para conta cliente
  - requests de compra no modo cliente

---

## Critérios de aceite (o professor vai validar)
- CRUD completo do usuário cliente funciona end-to-end.
- Existe vínculo confiável entre o usuário cliente e o registro em `clientes`.
- Usuário cliente consegue executar o fluxo de compra até a conclusão.
- Regras do estoque/vendas continuam válidas (não vende veículo duas vezes; não compra veículo indisponível; constraints/validações coerentes).
- Rotas respeitam autenticação e o perfil do usuário (cliente não acessa dados de outros clientes).
