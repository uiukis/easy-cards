/** Fills its parent; wrap in a positioned/sized element. Pure CSS
 *  rotation — runs on the compositor thread, no JS animation loop. */
export function Sunburst() {
  return <div className="bg-sunburst animate-spin-slow h-full w-full" />;
}
