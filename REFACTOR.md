# コスモさんぽ DX — リファクタリング設計（プログラミング的思考での分解）

## 1. ゲーム進行フロー（制御の一元化）

### 1.1 フェーズ定義

| フェーズ | 説明 | 次に遷移する先 |
|----------|------|----------------|
| `title` | タイトル画面 | タップで `prologue` |
| `prologue` | プロローグ（テキスト＋タップでスキップ） | タップで `stageIntro`(0) |
| `stageIntro` | ステージ間演出（タイトル・メッセージ） | タイマーで `playing` |
| `playing` | アクション画面（ステージプレイ中） | クリアで `stageClear` → 次ステージ or `ending` |
| `stageClear` | クリア演出（フキダシ） | タイマーで `stageIntro`(n+1) または `ending` |
| `ending` | エンディング | 「もういちど」で `title` |
| `gameover` | ゲームオーバー | リトライで `title` |

**重要**: 画面の表示・非表示と「今どのフェーズか」は **1か所（`goToPhase`）** でだけ切り替える。他では `game.phase` を直接書き換えない。

### 1.2 ステージ数

- **総ステージ数**: 6（定数 `TOTAL_STAGES = 6`）
- 表示: 「1 / 6」〜「6 / 6」
- ステージ6クリア後のみエンディングへ。

### 1.3 遷移の流れ（シーケンス）

```
[タイトル] --タップ--> [プロローグ] --タップ--> [ステージ1 演出] --自動--> [ステージ1 プレイ]
    ^                                                                          |
    |                                                                          v
    |                                                                   [ステージ1 クリア演出]
    |                                                                          |
    |   <-- もういちど/リトライ                                               v
    |                                                                   [ステージ2 演出] --> ... --> [ステージ6 プレイ]
    |                                                                          |
    |                                                                          v
    |                                                                   [ステージ6 クリア] --> [エンディング]
    |                                                                          |
    +-----------------------------------------------------------------------------+
```

---

## 2. 項目別分類（コードの責務）

### 2.1 定数・設定（Constants / Config）

- `TOTAL_STAGES`: 総ステージ数（6）
- `GAME_PHASE`: フェーズ名の定数（文字列）
- `STORY`: ステージ定義の配列（rank, title, message, enemies(), clearMessage）

### 2.2 音声（Audio）

- `AudioSys`: 初期化・再生・SE種別。ゲーム進行とは独立。

### 2.3 ゲーム進行制御（Game Flow）

- `game.phase`: 現在のフェーズ（上記のいずれか）
- `goToPhase(phase, payload)`: フェーズ遷移の **唯一の入口**
  - オーバーレイの表示切替（title / prologue / stageOverlay / ending / gameover）
  - 必要なら `stageIndex` などを payload で渡す
- `showStageIntro(stageIdx)`: ステージ演出表示 → タイマーで `beginStage(stageIdx)` → `goToPhase('playing', { stageIndex: stageIdx })`
- `onStageClear()`: クリア時。次ステージがあれば `showStageIntro(currentStage+1)`、なければ `goToPhase('ending')`

### 2.4 ゲームプレイ（Gameplay）

- プレイヤー・敵・星・アイテム・フキダシの **更新ロジック**（`update(dt)`）
- 入力（キー・タッチ・マウス）は `phase === 'playing'` のときだけゲームに渡す
- ステージ開始: `beginStage(stageIdx)` で敵・星を配置し、ループ開始

### 2.5 描画（Render）

- `render()`: SVG の書き換え。`phase === 'playing'` のときだけループで呼ぶ

### 2.6 UI・オーバーレイ（View）

- 各フェーズに対応する DOM の表示/非表示は `goToPhase` 内でまとめて行う
- ステージ表示: `stageLabel` を「n / 6」形式で更新

### 2.7 初期化（Init）

- `game.init()`: DOM・イベント登録・最初のフェーズを `title` に

---

## 3. リファクタ後のファイル内セクション構成

1. **定数・フェーズ定義** — `TOTAL_STAGES`, `GAME_PHASE`
2. **音声システム** — `AudioSys`
3. **ストーリーデータ** — `STORY`（6ステージ）
4. **ゲーム進行制御** — `goToPhase`, `showStageIntro`, `beginStage`, `onStageClear`, `showEnding`, `showGameOver`, `backToTitle`
5. **ゲーム本体オブジェクト** — `game`（phase, player, enemies, update, loop）
6. **入力** — キー・タッチ・ボタン（フェーズに応じて処理を分岐）
7. **描画** — `render`
8. **初期化・iOS対策** — `game.init()`, ダブルタップ防止

---

## 4. 変更のポイント

- **状態の一元化**: 画面の「どこにいるか」は `game.phase` のみで表現し、遷移は `goToPhase` に集約する。
- **ステージ数の明示**: ハードコードの「3」をやめ、`TOTAL_STAGES` と `STORY.stages.length` で 6 に対応。
- **ステージ表示**: `stageLabel` を常に「currentStage + 1 / TOTAL_STAGES」で更新する。
- **プロローグ → アクション → ステージ1〜6 → エンディング** の流れがコード上でも追いやすくなるよう、上記セクションとコメントで整理する。

---

最終更新: リファクタリング実施時
