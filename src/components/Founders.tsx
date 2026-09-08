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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FOUNDERS.map((f, i) => (
            <motion.a
              key={f.name}
              href={f.instagram}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex items-center gap-4 rounded-2xl border-2 border-ink/10 bg-surface p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Instagram profile photos */}
              <img
                src={f.image}
                alt={f.name}
                className="h-16 w-16 shrink-0 rounded-full border-2 border-ink/10 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-lg tracking-wide text-ink">
                  {f.name.toUpperCase()}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-orange-deep">
                  {f.role}
                </p>
              </div>
              <InstagramIcon className="h-5 w-5 shrink-0 text-ink-muted transition-colors group-hover:text-orange-deep" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
