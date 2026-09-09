-- Social on shared binders: likes + comments. Only works on binders that the
-- owner set to share_enabled. Owner gets an in-app notification.

create table binder_likes (
  binder_id uuid not null references binders(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (binder_id, user_id)
);

create table binder_comments (
  id uuid primary key default gen_random_uuid(),
  binder_id uuid not null references binders(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  -- denormalized so the public page can show the author without a profiles read
  -- (profiles has no public-read policy); filled by the server action
  author_name text,
  author_sprite text,
  created_at timestamptz not null default now()
);

create index binder_comments_binder_idx on binder_comments (binder_id, created_at);

alter table binder_likes enable row level security;
alter table binder_comments enable row level security;

-- a shared binder's social is readable by anyone; the owner can always read
create policy "binder_likes: read on shared" on binder_likes
  for select using (
    exists (select 1 from binders b where b.id = binder_id
            and (b.share_enabled = true or b.user_id = auth.uid()))
  );
create policy "binder_likes: like as self on shared" on binder_likes
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from binders b where b.id = binder_id and b.share_enabled = true)
  );
create policy "binder_likes: unlike own" on binder_likes
  for delete using (user_id = auth.uid());

create policy "binder_comments: read on shared" on binder_comments
  for select using (
    exists (select 1 from binders b where b.id = binder_id
            and (b.share_enabled = true or b.user_id = auth.uid()))
  );
create policy "binder_comments: comment as self on shared" on binder_comments
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from binders b where b.id = binder_id and b.share_enabled = true)
  );
create policy "binder_comments: delete own or as owner" on binder_comments
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from binders b where b.id = binder_id and b.user_id = auth.uid())
  );

-- Notify the binder owner about a like/comment (not for their own actions).
create or replace function public.notify_binder_social(p_binder_id uuid, p_kind text)
returns void
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_owner uuid;
  v_name text;
  v_actor text;
begin
  select user_id, name into v_owner, v_name from binders where id = p_binder_id;
  if v_owner is null or v_owner = auth.uid() then
    return;
  end if;

  select coalesce(split_part(full_name, ' ', 1), 'Alguém') into v_actor
  from profiles where id = auth.uid();

  insert into notifications (user_id, kind, title, body, link)
  values (
    v_owner,
    'binder_social',
    case when p_kind = 'like' then v_actor || ' curtiu seu fichário'
         else v_actor || ' comentou no seu fichário' end,
    v_name,
    '/b/' || p_binder_id::text
  );
end;
$$;
