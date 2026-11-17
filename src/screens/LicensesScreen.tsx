type Props = {
  onHome: () => void;
};

export function LicensesScreen({ onHome }: Props) {
  return (
    <main className="app license-page">
      <p>
        <button type="button" className="text-button" onClick={onHome}>
          ホームへ戻る
        </button>
      </p>
      <h1>ライセンス</h1>
      <p>このアプリが使っている画像、フォント、ライブラリです。</p>

      <h2>画像</h2>
      <p>
        <strong>質量分析計の絵</strong>
        <br />
        ChatGPT で作成しました。スペクトルやアミノ酸の玉など、ほかの図はコードで描いています。
      </p>

      <h2>フォント</h2>
      <p>SIL Open Font License 1.1。Google Fonts から読み込んでいます。</p>
      <p>
        <strong>Zen Maru Gothic</strong>
        <br />
        Copyright 2021 The Zen Maru Gothic Project Authors (
        <a href="https://github.com/googlefonts/zen-marugothic">https://github.com/googlefonts/zen-marugothic</a>
        ).
      </p>
      <p>
        <a href="https://scripts.sil.org/OFL">ライセンス原文</a>
      </p>

      <h2>ライブラリ</h2>
      <p>MIT License</p>
      <p>
        <strong>React、React DOM</strong>
        <br />
        Copyright (c) Meta Platforms, Inc. and affiliates.
      </p>
      <p>
        Permission is hereby granted, free of charge, to any person obtaining a copy of this
        software and associated documentation files (the “Software”), to deal in the Software
        without restriction, including without limitation the rights to use, copy, modify, merge,
        publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
        to whom the Software is furnished to do so, subject to the following conditions:
      </p>
      <p>
        The above copyright notice and this permission notice shall be included in all copies or
        substantial portions of the Software.
      </p>
    </main>
  );
}
