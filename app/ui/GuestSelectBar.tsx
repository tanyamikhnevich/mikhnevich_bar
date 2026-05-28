type Props = {
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function GuestSelectBar({ error, saving, onSave, onCancel }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mb-5 md:rounded-xl md:border md:border-rose-200 md:bg-rose-50/80 md:px-4 md:py-3 md:shadow-none">
      {error ? (
        <p className="mb-2 text-sm font-medium text-red-800">{error}</p>
      ) : (
        <p className="mb-2 hidden text-sm text-rose-950 md:block">
          Отметьте вина для гостевой карты и укажите цены.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-11 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-60 md:rounded-lg md:px-4 md:py-2"
        >
          Отменить
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-11 rounded-xl bg-rose-700 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-60 md:rounded-lg md:px-4 md:py-2"
        >
          {saving ? "…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
