-- Add the CTO tier and rename "owner" to "admin" (Bão and Emanoel).
-- This is a value rename, so every existing policy/function that
-- references user_role keeps working without being touched.
alter type user_role add value 'cto';
