"use client";

import { useState } from "react";
import { Loader2, HandCoins } from "lucide-react";
import type { Card, CardFinance } from "@/lib/supabase/types";
import { upsertCardFinance } from "./financeActions";
import { maskBRL, brlFromNumber, brlToPlain } from "@/lib/money";
import { BuyerPicker } from "./BuyerPicker";
import { ImageUploadField } from "@/components/ImageUploadField";
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
  const [finalPrice, setFinalPrice] = useState(brlFromNumber(finance?.final_price));
  const [buyerId, setBuyerId] = useState<string | null>(finance?.buyer_id ?? null);
  const [buyerName, setBuyerName] = useState(finance?.buyer_name ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState(finance?.delivery_method ?? "none");
  const [dominariaFee, setDominariaFee] = useState(brlFromNumber(finance?.dominaria_fee));
  const [dominariaDeposited, setDominariaDeposited] = useState(!!finance?.dominaria_deposited_at);
  const [dominariaDepositDate, setDominariaDepositDate] = useState(
    finance?.dominaria_deposited_at?.slice(0, 10) ?? todayISO()
  );
  const [notes, setNotes] = useState(finance?.notes ?? "");
  const [markSold, setMarkSold] = useState(!!finance?.sold_at);
  const [soldDate, setSoldDate] = useState(finance?.sold_at?.slice(0, 10) ?? todayISO());
  const [paid, setPaid] = useState(!!finance?.paid_at);
  const [paidDate, setPaidDate] = useState(finance?.paid_at?.slice(0, 10) ?? todayISO());
  const [consignorName, setConsignorName] = useState(finance?.consignor_name ?? "");
  const [commissionPct, setCommissionPct] = useState(
    finance?.commission_pct != null ? String(finance.commission_pct) : ""
  );
  const [consignorPaid, setConsignorPaid] = useState(!!finance?.consignor_paid_at);
  const [consignorPaidDate, setConsignorPaidDate] = useState(
    finance?.consignor_paid_at?.slice(0, 10) ?? todayISO()
  );
  const [photoUrl, setPhotoUrl] = useState(finance?.photo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertCardFinance(card.id, {
        final_price: brlToPlain(finalPrice),
        buyer_id: buyerId,
        buyer_name: buyerName,
        delivery_method: deliveryMethod === "none" ? "" : deliveryMethod,
        dominaria_fee: brlToPlain(dominariaFee),
        dominaria_deposited: dominariaDeposited,
        dominaria_deposit_date: dominariaDepositDate,
        paid,
        paid_date: paidDate,
        notes,
        mark_sold: markSold,
        sold_date: soldDate,
        consignor_name: consignorName,
        commission_pct: commissionPct.replace(",", "."),
        consignor_paid: consignorPaid,
        consignor_paid_date: consignorPaidDate,
        photo_url: photoUrl,
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
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={finalPrice}
              onChange={(e) => setFinalPrice(maskBRL(e.target.value))}
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
                inputMode="numeric"
                placeholder="R$ 0,00"
                className="border-primary/40"
                value={dominariaFee}
                onChange={(e) => setDominariaFee(maskBRL(e.target.value))}
              />

              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
                <Switch checked={dominariaDeposited} onCheckedChange={setDominariaDeposited} />
                Já depositei na Dominaria
              </label>
              {dominariaDeposited && (
                <div className="mt-2 space-y-1.5">
                  <Label>Data do depósito</Label>
                  <Input
                    type="date"
                    value={dominariaDepositDate}
                    onChange={(e) => setDominariaDepositDate(e.target.value)}
                  />
                </div>
              )}
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

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Switch checked={paid} onCheckedChange={setPaid} />
            Pagamento recebido
          </label>

          {paid && (
            <div className="space-y-1.5">
              <Label>Data do pagamento</Label>
              <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            </div>
          )}

          <div className="rounded-xl border-2 border-ink/10 p-3">
            <p className="text-sm font-semibold text-ink">Consignação (carta de terceiro)</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Dono da carta</Label>
                <Input
                  value={consignorName}
                  onChange={(e) => setConsignorName(e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comissão Easy Cards (%)</Label>
                <Input
                  inputMode="decimal"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value.replace(/[^0-9.,]/g, ""))}
                  placeholder="15"
                />
              </div>
            </div>
            {consignorName && (
              <>
                <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Switch checked={consignorPaid} onCheckedChange={setConsignorPaid} />
                  Já repassei pro dono
                </label>
                {consignorPaid && (
                  <div className="mt-2 space-y-1.5">
                    <Label className="text-xs">Data do repasse</Label>
                    <Input
                      type="date"
                      value={consignorPaidDate}
                      onChange={(e) => setConsignorPaidDate(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Foto real da carta (condição)</Label>
            <p className="text-[11px] text-ink-muted">
              Aparece pro comprador em “Minhas cartas”. Mostra o estado de verdade, não a arte oficial.
            </p>
            <ImageUploadField value={photoUrl} onChange={setPhotoUrl} shape="square" />
          </div>

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
