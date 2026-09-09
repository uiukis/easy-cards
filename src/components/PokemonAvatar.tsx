/** The person's favourite Pokémon, used as their avatar everywhere. Falls
 *  back to a name initial when there's no sprite yet. */
export function PokemonAvatar({
  sprite,
  name,
  size = 40,
  className = "",
}: {
  sprite?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };

  if (sprite) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- PokéAPI sprite CDN
      <img
        src={sprite}
        alt={name ?? "avatar"}
        style={style}
        className={`shrink-0 rounded-full border-2 border-ink/10 bg-surface-alt object-contain ${className}`}
      />
    );
  }

  return (
    <div
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-ink/10 bg-surface-alt font-display leading-none text-orange-deep ${className}`}
    >
      {(name?.trim().charAt(0) || "?").toUpperCase()}
    </div>
  );
}
