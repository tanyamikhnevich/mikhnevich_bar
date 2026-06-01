type Props = {
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function GuestSelectFooter({ error, saving, onSave, onCancel }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
      {error ? (
        <p className="mb-3 text-sm font-medium text-red-800">{error}</p>
      ) : (
        <p className="mb-3 text-sm text-rose-950">
          Отметьте вина и укажите цену за бутылку. Цена за бокал подставляется
          автоматически (бутылка ÷ 5 + 4); оставьте поле бокала пустым, если вино
          не разливаете по бокалам.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="min-h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 active:bg-zinc-50 disabled:opacity-60 sm:min-h-9"
        >
          Отменить
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white active:bg-rose-800 disabled:opacity-60 sm:min-h-9"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
