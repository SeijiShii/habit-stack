import { useState, type FormEvent } from "react";
import type { SetsRepo } from "./model/setsRepo.js";
import { useSets } from "./hooks/useSets.js";
import { setInputSchema } from "./model/schema.js";
import { TIME_OF_DAY, type TimeOfDay } from "../../types/domain.js";

const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: "朝",
  noon: "昼",
  evening: "夕",
  night: "夜",
};

export interface SetListPageProps {
  repo: SetsRepo;
  onOpenSet?: (id: string) => void;
  /** 計時中（進行中）のセット id。当該セットに「進行中」を表示する（R20260614-001）。 */
  inProgressSetId?: string | null;
}

export function SetListPage({
  repo,
  onOpenSet,
  inProgressSetId,
}: SetListPageProps) {
  const { sets, createSet } = useSets(repo);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = setInputSchema.safeParse({ name, timeOfDay });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください");
      return;
    }
    setError(null);
    createSet.mutate(parsed.data, { onSuccess: () => setName("") });
  };

  const list = sets.data ?? [];

  return (
    <main aria-labelledby="sets-title">
      <h1 id="sets-title">活動セット</h1>
      <p>続けたい習慣を時間帯ごとに組み立てましょう。</p>

      <form onSubmit={submit} aria-label="新しいセット">
        <input
          aria-label="セット名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 平日の朝"
        />
        <select
          aria-label="時間帯"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
        >
          {TIME_OF_DAY.map((t) => (
            <option key={t} value={t}>
              {TIME_LABEL[t]}
            </option>
          ))}
        </select>
        <button type="submit">追加</button>
        {error && <p role="alert">{error}</p>}
      </form>

      {TIME_OF_DAY.map((t) => {
        const group = list.filter((s) => s.timeOfDay === t);
        if (group.length === 0) return null;
        return (
          <section key={t} aria-label={TIME_LABEL[t]}>
            <h2>{TIME_LABEL[t]}</h2>
            <ul>
              {group.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => onOpenSet?.(s.id)}>
                    {s.name}
                    {s.id === inProgressSetId && (
                      <span data-testid="in-progress-badge"> ・進行中</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {list.length === 0 && (
        <p>まだセットがありません。ひとつ作ってみましょう。</p>
      )}
    </main>
  );
}
