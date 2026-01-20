-- Create Bills Table
create table public.bills (
  id text primary key,
  title text not null,
  description text not null,
  type text not null, -- 'PL', 'REQ', 'MO', 'EM'
  author text not null,
  status text not null default 'DISCUSSION', -- 'DISCUSSION', 'VOTING', 'APPROVED', 'REJECTED'
  created_at timestamptz default now()
);

-- Init Data
insert into public.bills (id, title, description, type, author, status)
values 
('PL-001/2024', 'Projeto de Lei da Transparência', 'Dispõe sobre a obrigatoriedade de transmissão ao vivo de todas as licitações municipais.', 'PL', 'Ver. Manoel', 'DISCUSSION'),
('REQ-002/2024', 'Reforma da Praça Central', 'Requerimento de urgência para obras de revitalização.', 'REQ', 'Ver. Ana', 'DISCUSSION'),
('MO-003/2024', 'Moção de Aplausos', 'Homenagem aos professores da rede municipal.', 'MO', 'Ver. Carlos', 'DISCUSSION');
