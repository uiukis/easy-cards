"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePushSubscription, removePushSubscription } from "@/app/instalar/pushActions";

type Status = "checking" | "unsupported" | "denied" | "off" | "on" | "working";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function EnablePushButton({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      ) {
        if (active) queueMicrotask(() => setStatus("unsupported"));
        return;
      }
      if (Notification.permission === "denied") {
        if (active) queueMicrotask(() => setStatus("denied"));
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (active) queueMicrotask(() => setStatus(sub ? "on" : "off"));
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  async function enable() {
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const json = sub.toJSON();
      if (!json.keys?.p256dh || !json.keys?.auth) throw new Error("Assinatura incompleta.");
      await savePushSubscription({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("on");
    } catch {
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("on");
    }
  }

  if (status === "checking") {
    return <div className={`h-11 animate-pulse rounded-full bg-surface-alt ${className}`} />;
  }

  if (status === "unsupported") return null;

  if (status === "denied") {
    return (
      <p className={`text-center text-xs text-ink-muted ${className}`}>
        Notificações bloqueadas nesse navegador. Pra ativar, libera nas permissões do site.
      </p>
    );
  }

  if (status === "on") {
    return (
      <Button
        onClick={disable}
        variant="outline"
        className={`h-auto w-full gap-2 rounded-full py-3 text-teal ${className}`}
      >
        <BellRing className="h-4 w-4" />
        Notificações ativadas
      </Button>
    );
  }

  return (
    <Button
      onClick={enable}
      disabled={status === "working"}
      variant="outline"
      className={`h-auto w-full gap-2 rounded-full py-3 ${className}`}
    >
      {status === "working" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {status === "working" ? "Ativando…" : "Ativar notificações"}
    </Button>
  );
}
