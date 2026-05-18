# Quantia

Software de orçamentação profissional para empresas de construção civil portuguesas.

## Funcionalidades

- Criação e gestão de orçamentos com capítulos e artigos
- Base de dados de artigos pré-carregada (105 artigos standard da construção civil)
- Cálculo automático de imprevistos, margem e IVA (23%, 6%, inversão do sujeito passivo)
- Gestão de clientes com validação de NIF português
- Geração de PDF profissional
- Exportação para Excel
- Auto-save a cada 30 segundos
- Responsivo (desktop e mobile)
- Autenticação segura via Supabase

## Pré-requisitos

- [Node.js 18+](https://nodejs.org) (inclui npm)
- Conta gratuita no [Supabase](https://supabase.com)

## Instalação e Configuração

### 1. Criar projeto no Supabase

1. Aceda a [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**
3. Dê um nome ao projeto (ex: `quantia`) e defina uma password segura
4. Aguarde o projeto ser criado (cerca de 1 minuto)

### 2. Executar o schema SQL

1. No painel do Supabase, vá a **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo do ficheiro `supabase/schema.sql`
4. Clique em **Run**

Isto irá criar todas as tabelas, ativar o RLS (Row Level Security) e configurar os triggers de autenticação.

### 3. Obter as credenciais

1. No painel do Supabase, vá a **Settings → API**
2. Copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon public key**

### 4. Configurar variáveis de ambiente

```bash
# Na pasta do projeto
cp .env.example .env
```

Edite o ficheiro `.env` com as suas credenciais:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 5. Instalar dependências e correr localmente

```bash
cd quantia
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### 6. Criar o primeiro utilizador

1. No painel do Supabase, vá a **Authentication → Users**
2. Clique em **Invite user** (ou **Add user**)
3. Introduza o email e password do utilizador
4. Ao fazer login pela primeira vez, o trigger criará automaticamente uma empresa associada ao utilizador
5. Vá a **Configurações** na app para preencher os dados da empresa

## Deploy (Produção)

### Vercel (recomendado, gratuito)

```bash
npm install -g vercel
vercel
```

Ou conecte o repositório GitHub à [Vercel](https://vercel.com) e configure as variáveis de ambiente no painel.

### Netlify (alternativa gratuita)

```bash
npm run build
# Faça upload da pasta dist/ no painel do Netlify
```

Ou conecte o repositório e configure:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- Adicione as variáveis de ambiente em **Site settings → Environment variables**

## Estrutura do Projeto

```
quantia/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Input, Modal, Badge, Spinner
│   │   ├── layout/       # Sidebar, Topbar, MobileNav, AppLayout
│   │   └── orcamento/    # CapituloEditor, ArtigoModal, ResumoPanel
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── OrcamentoEditor.jsx
│   │   ├── Clientes.jsx
│   │   └── Configuracoes.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useOrcamento.js
│   │   ├── useClientes.js
│   │   └── useEmpresa.js
│   ├── lib/
│   │   ├── supabase.js   # Cliente Supabase
│   │   ├── store.js      # Zustand store
│   │   ├── calculos.js   # Cálculo de totais
│   │   ├── pdf.js        # Geração PDF (jsPDF)
│   │   ├── excel.js      # Exportação Excel (xlsx)
│   │   └── validacoes.js # NIF, formatação de moeda
│   ├── data/
│   │   └── artigosBD.js  # 105 artigos pré-carregados
│   └── App.jsx           # Routing e auth protection
├── supabase/
│   └── schema.sql        # Schema completo + RLS + triggers
├── .env.example
└── README.md
```

## Suporte e Problemas

Se encontrar algum problema, verifique:

1. As variáveis de ambiente estão corretamente preenchidas no `.env`
2. O schema SQL foi executado com sucesso no Supabase
3. O utilizador foi criado via Supabase Authentication (não via registo direto)

---

**Quantia** — Software de orçamentação para construção civil portuguesa
