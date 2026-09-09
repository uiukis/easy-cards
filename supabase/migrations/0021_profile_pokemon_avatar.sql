-- The favourite Pokémon doubles as the person's avatar across the app.
-- We store the resolved sprite URL so rendering it doesn't hit PokéAPI.
alter table profiles add column favorite_pokemon_sprite text;
