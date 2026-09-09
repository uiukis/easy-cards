"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

function lastMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthClose() {
  const [month, setMonth] = useState(lastMonth());
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink/10 bg-surface p-3 text-sm">
      <span className="font-bold text-ink">Fechamento do mês</span>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="h-9 rounded-lg border-2 border-ink/15 bg-bg px-2 text-sm"
      />
      <a
        href={`/admin/financeiro/pdf?month=${month}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-orange-deep px-3 py-1.5 text-xs font-bold text-white"
      >
        <FileText className="h-3.5 w-3.5" />
        Gerar PDF do mês
      </a>
    </div>
  );
}
