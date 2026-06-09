import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main aria-labelledby="home-title">
      <h1 id="home-title">つみあげ、はじめましょう</h1>
      <p>
        続けたい習慣を時間帯ごとのセットにまとめ、開始から終了まで時間で記録します。
        何日続けられたかを、罪悪感なく穏やかに振り返れます。
      </p>
      <p>
        <Link to="/sets" className="btn-primary">
          セットを作る
        </Link>
      </p>
    </main>
  );
}
