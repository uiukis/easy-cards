"use client";

import { motion } from "motion/react";
import { InstagramIcon } from "./icons";
import { FOUNDERS } from "@/lib/site";

export function Founders() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <span className="font-comic text-sm tracking-wide text-orange-deep">
            ★ Quem tá por trás
          </span>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink sm:text-5xl">
            GENTE QUE TAMBÉM COLECIONA.
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FOUNDERS.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border-2 border-ink/10 bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg tracking-wide text-ink">
                    {f.name.toUpperCase()}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-deep">
                    {f.role}
                  </p>
                </div>
                <a
                  href={f.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram de ${f.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink/10 text-ink-muted transition-colors hover:border-orange hover:text-orange-deep"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-sm text-ink-muted">{f.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
