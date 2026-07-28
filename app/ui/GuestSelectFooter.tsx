"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function GuestSelectFooter({ error, saving, onSave, onCancel }: Props) {
  const { t } = useI18n();
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
      {error ? (
        <p className="mb-3 text-sm font-medium text-red-800">{error}</p>
      ) : (
        <p className="mb-3 text-sm text-rose-950">{t.guestSelect.footerHint}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-60 sm:min-h-9"
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-60 sm:min-h-9"
        >
          {saving ? t.common.saving : t.common.save}
        </button>
      </div>
    </div>
  );
}
