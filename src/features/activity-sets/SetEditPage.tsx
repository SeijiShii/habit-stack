import { useState, type FormEvent } from 'react';
import type { SetsRepo, SetRecord } from './model/setsRepo.js';
import { useItems } from './hooks/useSets.js';
import { itemInputSchema } from './model/schema.js';

export interface SetEditPageProps {
  repo: SetsRepo;
  set: SetRecord;
}

export function SetEditPage({ repo, set }: SetEditPageProps) {
  const { items, createItem, deleteItem } = useItems(repo, set);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = itemInputSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '入力を確認してください');
      return;
    }
    setError(null);
    createItem.mutate(parsed.data, { onSuccess: () => setName('') });
  };

  const list = items.data ?? [];

  return (
    <main aria-labelledby="set-edit-title">
      <h1 id="set-edit-title">{set.name}</h1>

      <form onSubmit={submit} aria-label="新しいアイテム">
        <input
          aria-label="アイテム名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 英単語"
        />
        <button type="submit">追加</button>
        {error && <p role="alert">{error}</p>}
      </form>

      <ul aria-label="アイテム一覧">
        {list.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <button
              type="button"
              aria-label={`${item.name} を削除`}
              onClick={() => deleteItem.mutate(item.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p>アイテムを追加しましょう。</p>}
    </main>
  );
}
