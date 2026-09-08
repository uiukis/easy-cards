"use client";

import { useState } from "react";
import { Loader2, HandCoins } from "lucide-react";
import type { Card, CardFinance } from "@/lib/supabase/types";
import { upsertCardFinance } from "./financeActions";
import { BuyerPicker } from "./BuyerPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DELIVERY_LABEL: Record<string, string> = {
  none: "Não definido",
  maos: "Em mãos",
  dominaria: "Dominaria",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceModal({
  card,
  finance,
  onClose,
  onSaved,
}: {
  card: Card;
  finance: CardFinance | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [finalPrice, setFinalPrice] = useState(finance?.final_price?.toString() ?? "");
  const [buyerId, setBuyerId] = useState<string | null>(finance?.buyer_id ?? null);
  const [buyerName, setBuyerName] = useState(finance?.buyer_name ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(finance?.delivery_method ?? "none");
  const [dominariaFee, setDominariaFee] = useState(finance?.dominaria_fee?.toString() ?? "");
  const [notes, setNotes] = useState(finance?.notes ?? "");
  const [markSold, setMarkSold] = useState(!!finance?.sold_at);
  const [soldDate, setSoldDate] = useState(finance?.sold_at?.slice(0, 10) ?? todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertCardFinance(card.id, {
        final_price: finalPrice,
        buyer_id: buyerId,
        buyer_name: buyerName,
        delivery_method: deliveryMethod === "none" ? "" : deliveryMethod,
        dominaria_fee: dominariaFee,
        notes,
        mark_sold: markSold,
        sold_date: soldDate,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu pra salvar.");
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wide">
            <HandCoins className="h-5 w-5 text-primary" />
            FINANCEIRO — {card.name.toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Preço da carta</Label>
            <Input
              type="number"
              step="0.01"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Comprador</Label>
            <BuyerPicker
              buyerId={buyerId}
              buyerName={buyerName}
              onChange={(b) => {
                setBuyerId(b.id);
                setBuyerName(b.name);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Entrega</Label>
            <Select value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => DELIVERY_LABEL[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definido</SelectItem>
                <SelectItem value="maos">Em mãos</SelectItem>
                <SelectItem value="dominaria">Dominaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deliveryMethod === "dominaria" && (
            <div className="space-y-1.5">
              <Label className="text-primary">
                Taxa do envelope de depósito da Dominaria (não entra no valor da carta)
              </Label>
              <Input
                type="number"
                step="0.01"
                className="border-primary/40"
                value={dominariaFee}
                onChange={(e) => setDominariaFee(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Switch checked={markSold} onCheckedChange={setMarkSold} />
            Marcar carta como vendida
          </label>

          {markSold && (
            <div className="space-y-1.5">
              <Label>Data da venda</Label>
              <Input type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
