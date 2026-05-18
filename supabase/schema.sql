-- ============================================================
-- QUANTIA — Schema Supabase
-- Execute este ficheiro no SQL Editor do Supabase
-- ============================================================

-- Empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nif TEXT,
  morada TEXT,
  codigo_postal TEXT,
  localidade TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  alvara TEXT,
  config_imprevistos DECIMAL DEFAULT 5,
  config_margem DECIMAL DEFAULT 10,
  config_iva TEXT DEFAULT '23',
  config_validade INTEGER DEFAULT 30,
  config_rodape TEXT,
  config_condicoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utilizadores
CREATE TABLE IF NOT EXISTS utilizadores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  nif TEXT,
  morada TEXT,
  codigo_postal TEXT,
  localidade TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_validade DATE,
  estado TEXT DEFAULT 'rascunho',
  pct_imprevistos DECIMAL DEFAULT 5,
  pct_margem DECIMAL DEFAULT 10,
  tipo_iva TEXT DEFAULT '23',
  mostrar_margem BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  notas_internas TEXT,
  subtotal DECIMAL DEFAULT 0,
  total_com_iva DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capítulos
CREATE TABLE IF NOT EXISTS capitulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artigos do orçamento
CREATE TABLE IF NOT EXISTS artigos_orcamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id UUID REFERENCES capitulos(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'm²',
  quantidade DECIMAL NOT NULL DEFAULT 1,
  preco_unitario DECIMAL NOT NULL DEFAULT 0,
  total DECIMAL GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BD de artigos (globais + personalizados)
CREATE TABLE IF NOT EXISTS artigos_bd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  capitulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'm²',
  preco_min DECIMAL DEFAULT 0,
  preco_max DECIMAL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilizadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE capitulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE artigos_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE artigos_bd ENABLE ROW LEVEL SECURITY;

-- Helper: empresa do utilizador autenticado
CREATE OR REPLACE FUNCTION get_empresa_id()
RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT empresa_id FROM utilizadores WHERE id = auth.uid() LIMIT 1;
$$;

-- Políticas: utilizadores
CREATE POLICY "utilizadores_own" ON utilizadores FOR ALL USING (id = auth.uid());

-- Políticas: empresas
CREATE POLICY "empresas_own" ON empresas FOR ALL USING (id = get_empresa_id());

-- Políticas: clientes
CREATE POLICY "clientes_empresa" ON clientes FOR ALL USING (empresa_id = get_empresa_id());

-- Políticas: orçamentos
CREATE POLICY "orcamentos_empresa" ON orcamentos FOR ALL USING (empresa_id = get_empresa_id());

-- Políticas: capítulos
CREATE POLICY "capitulos_empresa" ON capitulos FOR ALL
  USING (orcamento_id IN (SELECT id FROM orcamentos WHERE empresa_id = get_empresa_id()));

-- Políticas: artigos_orcamento
CREATE POLICY "artigos_orcamento_empresa" ON artigos_orcamento FOR ALL
  USING (orcamento_id IN (SELECT id FROM orcamentos WHERE empresa_id = get_empresa_id()));

-- Políticas: artigos_bd (globais = leitura pública; personalizados = empresa)
CREATE POLICY "artigos_bd_read_global" ON artigos_bd FOR SELECT
  USING (empresa_id IS NULL OR empresa_id = get_empresa_id());
CREATE POLICY "artigos_bd_write_empresa" ON artigos_bd FOR INSERT
  WITH CHECK (empresa_id = get_empresa_id());
CREATE POLICY "artigos_bd_update_empresa" ON artigos_bd FOR UPDATE
  USING (empresa_id = get_empresa_id());
CREATE POLICY "artigos_bd_delete_empresa" ON artigos_bd FOR DELETE
  USING (empresa_id = get_empresa_id());

-- ============================================================
-- TRIGGER: criar utilizador e empresa após registo
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_empresa_id UUID;
BEGIN
  -- Cria empresa por defeito
  INSERT INTO empresas (nome) VALUES (COALESCE(NEW.raw_user_meta_data->>'empresa_nome', 'Minha Empresa'))
  RETURNING id INTO new_empresa_id;

  -- Liga utilizador à empresa
  INSERT INTO utilizadores (id, empresa_id, email, nome, role)
  VALUES (
    NEW.id,
    new_empresa_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'admin'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE: bucket para logos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('empresas', 'empresas', TRUE)
ON CONFLICT DO NOTHING;

CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'empresas');
CREATE POLICY "logos_empresa_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empresas' AND auth.role() = 'authenticated');
CREATE POLICY "logos_empresa_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'empresas' AND auth.role() = 'authenticated');
