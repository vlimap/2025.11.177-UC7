# Desafio Tecnico – Desenvolvedor(a) Node.js/Express | Empresa Ficticia "MobilityX"

## Sobre a vaga
- Modelo: remoto-first (fuso BRT ±3h); contrato CLT ou PJ.
- Faixa salarial: CLT R$ 13.000–16.000 bruto + PLR anual; PJ R$ 85–105/h, 160h/mes.
- Beneficios (CLT): VR/VA R$ 1.200, plano de saude e odontologico nacionais, auxilio home office R$ 250, Gympass.
- Stack esperada: Node.js (>=18), Express, JWT, PostgreSQL, Sequelize/Knex (ou SQL puro), Jest/Supertest, Docker opcional.

## Contexto do produto a ser entregue
Crie um MVP de marketplace de veiculos com autenticacao/autorizacao, CRUDs, regras de negocio de estoque/venda e trilha de auditoria simplificada. Use o projeto-base como referencia de estrutura (controllers, models, routes, db, middlewares).

## Requisitos funcionais
- Autenticacao com JWT; rotas publicas: login e cadastro de usuario; demais rotas privadas.
- Perfis: `admin` e `seller`. Admin pode tudo; seller nao pode excluir usuarios nem alterar vendas de outros.
- Entidades minimas:
  - `Usuario`: nome, email (unico), hash de senha, perfil.
  - `Cliente`: nome, documento, email, telefone.
  - `Veiculo`: marca, modelo, ano, preco, status (`disponivel`, `reservado`, `vendido`).
  - `Venda`: veiculo, cliente, vendedor, valor final, data, forma de pagamento, status (`concluida`, `cancelada`), observacoes.
- Regras de negocio:
  - Criar venda so se veiculo estiver `disponivel`; ao criar, status do veiculo vira `vendido`.
  - Cancelar venda reverte veiculo para `disponivel` e registra motivo.
  - Nao permitir duas vendas ativas para o mesmo veiculo.
  - Atualizar status do veiculo para `reservado` ao criar um pre-pedido (rota opcional extra).
- Auditoria basica:
  - Registrar em tabela/log: usuario, acao, recurso, timestamp, payload resumido (criacao/atualizacao/cancelamento de venda).
- Validacoes:
  - Campos obrigatorios; formato de email; preco > 0; ano >= 1990; senha com politica minima (8+ chars, numero e letra).
- Respostas:
  - Mensagens de erro claras; codigos HTTP consistentes; evitar vazamento de stack/SQL.

## Requisitos nao funcionais
- Organizacao de pastas semelhante ao template (controllers, routes, middlewares, models/database).
- Uso de variaveis de ambiente para credenciais e segredo JWT.
- Scripts no `package.json`: `dev`, `test`, `lint` (se usar), `start`.
- Testes: minimo para autenticacao e uma rota de negocio (ex.: criacao de venda) com Jest + Supertest.
- Lint/format: opcional, mas desejado (ESLint/Prettier).
- Docker: opcional; se usar, fornecer `Dockerfile` + `docker-compose` para app + banco.
- Seed inicial: opcional, mas desejado (usuario admin e alguns veiculos/clientes).

## Criterios de avaliacao
- Correcao das regras de negocio e integridade dos dados.
- Seguranca basica: hash de senha (bcrypt/argon2), expiracao de JWT, checagem de perfil na middleware, protecao contra mass assignment.
- Qualidade de API: consistencia de status codes, mensagens e contratos.
- Testabilidade: presenca e clareza de testes automatizados.
- Clareza do README: como rodar, variaveis de ambiente, scripts, rota de saude (healthcheck), exemplos de requests.
- Qualidade do SQL ou do ORM (migrations/seed), evitando N+1 quando aplicavel.
- Logging minimo util para depuracao local.

## Entregaveis
- Codigo fonte do desafio em repositorio publico ou zip.
- README com: pre-requisitos, setup, variaveis de ambiente, como rodar (com e sem Docker), como rodar testes, usuario/senha seed (se houver), exemplos de chamadas (requests.http ou curl).
- Diagrama simples (pode ser texto/mermaid) das entidades e relacionamentos.
- Lista breve de decisoes tecnicas e trade-offs.

## Expectativas de tempo
- Esforco estimado: 6–8 horas efetivas.
- Entrega em ate 5 dias corridos apos receber o desafio.

## Extensoes opcionais (ganham pontos)
- Metricas/healthcheck (`/health`, `/metrics` simples).

## Como submeter
Envie o link do repositorio ou um pacote zip e inclua instrucoes claras no README. 
