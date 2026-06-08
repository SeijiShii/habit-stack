// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { LocalStore } from '../../services/sync/localStore.js';
import { SetsRepo } from './model/setsRepo.js';
import { SetListPage } from './SetListPage.js';
import { asOwnerId } from '../../types/domain.js';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

async function makeRepo() {
  return new SetsRepo(await LocalStore.open(), asOwnerId('owner_1'));
}

describe('SetListPage (UC1)', () => {
  it('S1: セット作成 → 朝グループに表示', async () => {
    const repo = await makeRepo();
    const user = userEvent.setup();
    wrap(<SetListPage repo={repo} />);

    await user.type(screen.getByLabelText('セット名'), '平日の朝');
    await user.click(screen.getByRole('button', { name: '追加' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '平日の朝' })).toBeTruthy(),
    );
    // 朝グループ見出しが出る
    expect(screen.getByRole('heading', { name: '朝' })).toBeTruthy();
  });

  it('S2: 空 name でバリデーションエラー、保存されない', async () => {
    const repo = await makeRepo();
    const user = userEvent.setup();
    wrap(<SetListPage repo={repo} />);

    await user.click(screen.getByRole('button', { name: '追加' }));
    expect(screen.getByRole('alert').textContent).toContain('名前');
    expect(await repo.listSets()).toHaveLength(0);
  });
});
