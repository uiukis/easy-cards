-- Accountability: cards already track created_by; add updated_by so the team
-- can see who last touched a card (and when, via updated_at).
alter table cards add column if not exists updated_by uuid references profiles(id);
