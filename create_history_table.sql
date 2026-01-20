-- Create a table for storing session history
create table public.history (
  id text primary key,
  bill_id text not null,
  date text not null,
  result jsonb not null,
  individual_votes jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Real-time
alter publication supabase_realtime add table public.history;

-- Create policy to allow all access (since we are handling roles in app for now, or you can restrict)
create policy "Allow all access" on public.history for all using (true) with check (true);
alter table public.history enable row level security;
