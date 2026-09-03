import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Easy Cards — Compra, Venda e Troca de Cards Pokémon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/brand/logo-full.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf1df",
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #ffb347 0%, transparent 60%)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 40,
            padding: "0 80px",
          }}
        >
          <img src={logoSrc} width={420} height={419} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 108,
                fontWeight: 900,
                color: "#d9660b",
                letterSpacing: -2,
                textShadow: "6px 6px 0 #16305c",
              }}
            >
              EASY CARDS
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 16,
                fontSize: 34,
                fontWeight: 700,
                color: "#1c1710",
              }}
            >
              Compra · Venda · Troca de Cards Pokémon
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 26,
                fontWeight: 700,
                color: "#fff",
                background: "#2f8f7f",
                padding: "10px 24px",
                borderRadius: 9999,
                alignSelf: "flex-start",
              }}
            >
              Comunidade Pokémon TCG
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
