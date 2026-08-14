-- Banco do Lembra, para colar no SQL Editor da Supabase.
--
-- É uma tabela só: cada conta tem uma linha com o caderno inteiro em JSON.
-- Parece grosseiro para quem está acostumado a normalizar tudo, e é a escolha
-- certa aqui: o aparelho é a fonte, a nuvem é a segunda cópia, e o app já
-- sabe juntar dois cadernos sozinho. Uma linha por conta torna impossível
-- meio-caderno chegar do outro lado.
--
-- A chave "anon" que fica no código do app não abre nada por si. Quem protege
-- é a regra de linha aqui embaixo: cada pessoa só enxerga e só escreve na
-- própria linha, garantido pelo banco, não pelo aplicativo.

create table if not exists public.caderno (
  dono          uuid primary key references auth.users (id) on delete cascade,
  dados         jsonb       not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.caderno enable row level security;

-- Sem estas quatro regras a tabela fica trancada para todo mundo, inclusive
-- para o dono: com RLS ligado e nenhuma política, nada passa.

drop policy if exists "cada um lê o seu" on public.caderno;
create policy "cada um lê o seu"
  on public.caderno for select
  using (auth.uid() = dono);

drop policy if exists "cada um cria o seu" on public.caderno;
create policy "cada um cria o seu"
  on public.caderno for insert
  with check (auth.uid() = dono);

drop policy if exists "cada um altera o seu" on public.caderno;
create policy "cada um altera o seu"
  on public.caderno for update
  using (auth.uid() = dono)
  with check (auth.uid() = dono);

drop policy if exists "cada um apaga o seu" on public.caderno;
create policy "cada um apaga o seu"
  on public.caderno for delete
  using (auth.uid() = dono);
