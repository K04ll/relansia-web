// app/app/onboarding/rules/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ---------------------------- Types & helpers ---------------------------- */

type Channel = "email" | "sms" | "whatsapp";
type Rule = {
  id: string;
  delayDays: number;     // J+X
  channel: Channel;
  enabled: boolean;
  template: string;      // ex: "Bonjour {{first_name}} ..."
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Valeurs d’exemple pour l’aperçu
const SAMPLE = {
  first_name: "Camille",
  store_name: "Relansia Demo Shop",
  cta_url: "https://example.com/offre",
  signature: "L’équipe Relansia",
};

// Templates recommandés (simples, humains)
const TEMPLATES = {
  j1_email:
    "Merci pour votre achat chez {{store_name}} ! Dites-nous si tout est OK. Besoin d’un réassort ? On est là pour vous aider.\n\nVoir l’offre : {{cta_url}}\n\n{{signature}}",
  j2_email:
    "Re 👋 {{first_name}},\n\nPetit rappel amical — votre produit peut bientôt manquer. On vous a réservé une offre.\n\nVoir l’offre : {{cta_url}}\n\n{{signature}}",
  j7_email:
    "{{first_name}}, on a pensé à vous : offre spéciale de réachat chez {{store_name}}.\n\nVoir l’offre : {{cta_url}}\n\n{{signature}}",
  sms:
    "Hello {{first_name}} — rappel {{store_name}}. Votre offre est prête : {{cta_url}}",
  whatsapp:
    "👋 {{first_name}} — c’est {{store_name}}. Voici votre offre de réachat : {{cta_url}}",
};

function renderPreview(tpl: string) {
  return tpl
    .replaceAll("{{first_name}}", SAMPLE.first_name)
    .replaceAll("{{store_name}}", SAMPLE.store_name)
    .replaceAll("{{cta_url}}", SAMPLE.cta_url)
    .replaceAll("{{signature}}", SAMPLE.signature);
}

/* --------------------------------- Page --------------------------------- */

export default function RulesStep() {
  const router = useRouter();

  const [rules, setRules] = useState<Rule[]>([
    { id: uid(), delayDays: 1, channel: "email", enabled: true, template: TEMPLATES.j1_email },
    { id: uid(), delayDays: 2, channel: "email", enabled: true, template: TEMPLATES.j2_email },
    { id: uid(), delayDays: 7, channel: "email", enabled: true, template: TEMPLATES.j7_email },
  ]);

  const canActivate = useMemo(() => rules.length > 0, [rules]);

  function loadPresets() {
    setRules([
      { id: uid(), delayDays: 1, channel: "email", enabled: true, template: TEMPLATES.j1_email },
      { id: uid(), delayDays: 2, channel: "email", enabled: true, template: TEMPLATES.j2_email },
      { id: uid(), delayDays: 7, channel: "email", enabled: true, template: TEMPLATES.j7_email },
    ]);
  }

  function addRule() {
    setRules((r) => [
      ...r,
      { id: uid(), delayDays: 3, channel: "email", enabled: true, template: TEMPLATES.j2_email },
    ]);
  }

  function duplicateRule(id: string) {
    setRules((r) => {
      const found = r.find((x) => x.id === id);
      if (!found) return r;
      return [...r, { ...found, id: uid() }];
    });
  }

  function removeRule(id: string) {
    setRules((r) => r.filter((x) => x.id !== id));
  }

  function updateRule(id: string, patch: Partial<Rule>) {
    setRules((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function onActivate() {
    // TODO: appeler /api/reminders/generate côté serveur
    router.push("/app/reminders");
  }

  return (
    <main className="py-10">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Règles d’envoi</h1>
      <p className="mt-1 text-[var(--text-dim)]">
        Step 3 — Choisissez vos délais, vos canaux et personnalisez les messages si besoin.
      </p>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={loadPresets}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-sm hover:bg-[var(--surface)]/80 transition cursor-pointer"
        >
          Charger les presets J+1 / J+2 / J+7
        </button>
        <button
          onClick={addRule}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-2 text-sm hover:bg-[var(--surface)]/80 transition cursor-pointer"
        >
          + Ajouter une règle
        </button>
      </div>

      {/* Liste des règles */}
      <div className="mt-4 space-y-4">
        {rules.map((rule, i) => (
          <RuleCard
            key={rule.id}
            index={i + 1}
            rule={rule}
            onUpdate={(p) => updateRule(rule.id, p)}
            onDuplicate={() => duplicateRule(rule.id)}
            onRemove={() => removeRule(rule.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Link href="/app/onboarding/step2" className="btn-ghost cursor-pointer">
          Retour
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2 hover:bg-[var(--surface)]/80 transition cursor-pointer"
          >
            Sauvegarder
          </button>
          <button
            disabled={!canActivate}
            onClick={onActivate}
            className={[
              "rounded-xl px-5 py-2 text-white shadow-sm transition",
              canActivate
                ? "bg-[var(--primary)] hover:opacity-90 cursor-pointer"
                : "bg-[var(--border)] text-white/60 cursor-not-allowed",
            ].join(" ")}
          >
            Activer mes relances
          </button>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------- Card ----------------------------------- */

function RuleCard({
  index,
  rule,
  onUpdate,
  onDuplicate,
  onRemove,
}: {
  index: number;
  rule: Rule;
  onUpdate: (p: Partial<Rule>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const previewText = useMemo(() => renderPreview(rule.template), [rule.template]);

  function insertAtCursor(token: string) {
    const el = textareaRef.current;
    if (!el) {
      onUpdate({ template: (rule.template || "") + token });
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = rule.template.slice(0, start);
    const after = rule.template.slice(end);
    const next = before + token + after;
    onUpdate({ template: next });
    // replacer le curseur après le token
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-4">
      {/* Header mini */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 text-sm">
            #{index}
          </span>

          {/* Délai J+X */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-dim)]">J+</span>
            <input
              type="number"
              min={0}
              className="w-16 rounded-xl border border-[var(--border)] bg-white/70 dark:bg-white/[0.05] px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={rule.delayDays}
              onChange={(e) => onUpdate({ delayDays: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            />
          </div>

          {/* Canal */}
          <ChannelTabs
            value={rule.channel}
            onChange={(c) => onUpdate({ channel: c })}
          />
        </div>

        {/* Actions carte */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="accent-[var(--primary)] h-4 w-4"
              checked={rule.enabled}
              onChange={(e) => onUpdate({ enabled: e.target.checked })}
            />
            Activer
          </label>

          <button
            onClick={onDuplicate}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1.5 text-sm hover:bg-[var(--surface)]/80 transition cursor-pointer"
            title="Dupliquer"
          >
            Dupliquer
          </button>
          <button
            onClick={onRemove}
            className="rounded-xl border border-[var(--danger)]/40 text-[var(--danger)] px-3 py-1.5 text-sm hover:bg-[var(--danger)]/10 transition cursor-pointer"
            title="Supprimer"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Corps : éditeur + preview */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)]/80 bg-white/70 dark:bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Message</h3>
            <button
              onClick={() => setShowEditor((s) => !s)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/60 px-2 py-1 text-xs hover:bg-[var(--surface)]/80 transition cursor-pointer"
            >
              {showEditor ? "Masquer" : "Personnaliser le message"}
            </button>
          </div>

          {showEditor && (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                <TokenButton label="Prénom" onClick={() => insertAtCursor("{{first_name}}")} />
                <TokenButton label="Nom boutique" onClick={() => insertAtCursor("{{store_name}}")} />
                <TokenButton label="Lien offre" onClick={() => insertAtCursor("{{cta_url}}")} />
                <TokenButton label="Signature" onClick={() => insertAtCursor("{{signature}}")} />
              </div>

              <textarea
                ref={textareaRef}
                className="mt-3 w-full rounded-xl border border-[var(--border)]/80 bg-white/70 dark:bg-white/[0.03] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                rows={8}
                value={rule.template}
                onChange={(e) => onUpdate({ template: e.target.value })}
                placeholder="Votre message (Email / SMS / WhatsApp)"
              />
              <p className="mt-2 text-xs text-[var(--text-dim)]">
                Astuce : utilisez les boutons ci-dessus pour insérer un champ automatiquement.
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/40 p-3">
          <h3 className="text-sm font-medium mb-2">Aperçu</h3>
          <div className="rounded-lg border border-[var(--border)]/60 bg-white/70 dark:bg-white/[0.02] p-3 text-sm whitespace-pre-wrap">
            {previewText}
          </div>
          <p className="mt-2 text-xs text-[var(--text-dim)]">
            {rule.channel === "email"
              ? "Exemple d’email généré pour un client type."
              : rule.channel === "sms"
              ? "Exemple de SMS court (veillez à rester concis)."
              : "Exemple de message WhatsApp."}
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Sous composants ---------------------------- */

function ChannelTabs({
  value,
  onChange,
}: {
  value: Channel;
  onChange: (c: Channel) => void;
}) {
  const items: { key: Channel; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "sms", label: "SMS" },
    { key: "whatsapp", label: "WhatsApp" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-1">
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={[
              "px-3 py-1.5 text-sm rounded-lg transition cursor-pointer",
              active
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "hover:bg-[var(--surface)]/70",
            ].join(" ")}
            aria-pressed={active}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function TokenButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 px-3 py-1 text-xs hover:bg-[var(--surface)]/80 transition cursor-pointer"
      title={`Insérer ${label.toLowerCase()}`}
    >
      {label}
    </button>
  );
}
