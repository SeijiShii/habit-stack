# streak-summary 単体テスト計画（O31 シェア導線）

## 1. 追加テストケース
- render: 編集可能 textarea（default 短文）+ 「共有する」+「X で送る」リンク。
- 編集: textarea 変更が反映。
- share 成功: 注入 share が呼ばれ true → role=status「ありがとう…」。
- fallback: 注入 share が false → copy が `text url` で呼ばれ role=status「コピー…」。
- X リンク: href に encodeURIComponent(text)/url を含む。

## 4. リグレッション
既存 streak-summary テスト維持（純追加）。
