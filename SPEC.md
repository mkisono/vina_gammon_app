# 海老名でバックギャモン 結果記録アプリ

このアプリは、バックギャモンイベントの結果を記録・集計するアプリです。

## 仕様

### 認証

- ユーザー認証は Amazon Cognito で行う
- 認証方式は email OTP とする
- refresh token の有効期限は 1年とする

### ユーザーロール

- ユーザーロールは以下の2種類を用意する
  - 一般ユーザー
  - 管理者

### 権限設計

ロールごとの操作権限は以下とする。

| 操作 | 一般ユーザー | 管理者 |
| --- | --- | --- |
| イベント作成ページへの導線(アカウントメニュー) | 非表示 | 表示 |
| イベント作成ページの実行 | 不可 | 可 |
| イベント状態(open/close/hide)の変更 | 不可 | 可 |
| イベントページ閲覧 | 可 | 可 |
| 自分のユーザー情報(ニックネーム/本名)登録・更新 | 可 | 可 |
| 試合結果の新規登録 | 可 | 可 |
| 試合結果の編集(自分が登録した結果) | 可 | 可 |
| 試合結果の編集(他ユーザーが登録した結果) | 不可 | 可 |
| 集計結果の閲覧(イベント/1年/All time) | 可 | 可 |

#### 補足ルール

- 管理者は、全イベント・全試合結果に対して編集権限を持つ
- 一般ユーザーは、自分が登録した試合結果のみ編集できる
- 本名は非公開情報として扱い、本人と管理者のみ参照・更新できる
- 画面上のアカウントメニューには、管理者ログイン時のみ「イベント作成」を表示する
- イベント作成は独立ページ(`/events/create`)で実行する

### API認可ルール

- 認証済みユーザーのみAPIを利用できる
- 管理者ロール判定は Cognito のグループクレーム(`ADMIN`)で行う
- 認可設計は model-level を基本とする
  - `Event`: 読み取りは認証済みユーザー、作成・更新・削除は管理者のみ
  - `PublicProfile`: 作成・読み取りは認証済みユーザー、更新は本人または管理者のみ
  - `NicknameRegistry`: 作成・読み取り・更新・削除は本人または管理者のみ
  - `PrivateProfile`: 作成は認証済みユーザー、読み取り・更新は本人または管理者のみ
  - `MatchResult`: 読み取り・作成は認証済みユーザー、更新は作成者本人または管理者のみ
- field-level の認可は原則として持たず、モデル単位で操作権限を管理する
- 一般ユーザーが更新可能なプロフィール項目は、`PublicProfile.nickname` と `PrivateProfile.realName` のみとする

| API操作 | 一般ユーザー | 管理者 | 認可条件 |
| --- | --- | --- | --- |
| Event作成 | 不可 | 可 | `Event` モデルに対して `group contains ADMIN` |
| Event更新(任意項目) | 不可 | 可 | `Event` モデルに対して `group contains ADMIN` |
| Event削除 | 不可 | 可 | `Event` モデルに対して `group contains ADMIN` |
| Event取得(単体/一覧) | 可 | 可 | `Event` モデルの read を認証済みユーザーに許可 |
| PublicProfile作成 | 可 | 可 | `PublicProfile` モデルの create を認証済みユーザーに許可。`userId = Cognito sub` |
| PublicProfile更新(自分) | 可 | 可 | `PublicProfile` モデルに対して owner。更新可能項目は `nickname` のみ |
| PublicProfile更新(他人) | 不可 | 可 | `PublicProfile` モデルに対して `group contains ADMIN` |
| PublicProfile削除 | 不可 | 可 | `PublicProfile` モデルに対して `group contains ADMIN` |
| NicknameRegistry作成(自分のニックネーム予約) | 可 | 可 | `NicknameRegistry` モデルに対して owner (`userId = requesterUserId`) |
| NicknameRegistry取得/更新/削除(自分) | 可 | 可 | `NicknameRegistry` モデルに対して owner (`userId = requesterUserId`) |
| NicknameRegistry取得/更新/削除(他人) | 不可 | 可 | `NicknameRegistry` モデルに対して `group contains ADMIN` |
| PrivateProfile作成 | 可 | 可 | `PrivateProfile` モデルの create を認証済みユーザーに許可。`userId = Cognito sub` |
| PrivateProfile取得(自分) | 可 | 可 | `PrivateProfile` モデルに対して owner read |
| PrivateProfile取得(他人) | 不可 | 可 | `PrivateProfile` モデルに対して `group contains ADMIN` |
| PrivateProfile更新(自分) | 可 | 可 | `PrivateProfile` モデルに対して owner。更新可能項目は `realName` のみ |
| PrivateProfile更新(他人) | 不可 | 可 | `PrivateProfile` モデルに対して `group contains ADMIN` |
| PrivateProfile削除 | 不可 | 可 | `PrivateProfile` モデルに対して `group contains ADMIN` |
| MatchResult作成 | 可 | 可 | `MatchResult` モデルの create を認証済みユーザーに許可。`playerUserId = requesterUserId` |
| MatchResult更新(自分が作成) | 可 | 可 | `MatchResult` モデルに対して owner (`playerUserId = requesterUserId`) |
| MatchResult更新(他人が作成) | 不可 | 可 | `MatchResult` モデルに対して `group contains ADMIN` |
| MatchResult削除 | 不可 | 可 | `MatchResult` モデルに対して `group contains ADMIN` |
| 集計取得(イベント/1年/All time) | 可 | 可 | 集計対象モデル (`Event`, `PublicProfile`, `MatchResult`) の read を認証済みユーザーに許可 |

### 機能要件

#### イベント

- 新しいイベントを作成できる
  - 管理者だけがイベントを作成できる
  - アカウントアイコンのメニューに、管理者ログイン時のみ「イベント作成」を表示する
  - 「イベント作成」は独立ページ(`/events/create`)に遷移して実行する
  - イベントは状態(`status`)を持つ
    - `open`: 一覧表示され、試合結果の新規登録が可能
    - `close`: 一覧表示されるが、試合結果の新規登録は不可
    - `hide`: イベント一覧に表示しない
  - イベント状態の変更は管理者のみ実行可能とする
  - イベントごとに一意のURLが生成され、公開用URL識別子には `eventId` を使用する
- イベントページの目的は以下の2つとする
  - 試合結果の登録・編集
  - 当該イベントの登録済み試合結果を集計したランキング表示
- イベントページでは、当該イベントの登録済み試合結果をその時点で集計し、ランキングを表示する
  - 表示指標は合計ポイント(勝者は加点、敗者は同ポイントを減点)
  - 補助指標として、通算ポイント数(勝敗に関係なく対戦した試合ポイントの合計)を表示する
  - 表示順はポイント合計の降順、同率の場合はニックネームの TypeScript(JavaScript) 文字列ソート順による昇順
  - 試合結果の登録・編集後は最新集計結果で再表示する

#### ユーザー

- ユーザーの属性は以下の通り
  - ニックネーム(必須)
    - 公開される情報
    - システム内で一意とする(大文字小文字/前後空白を正規化して判定)
  - 本名(必須)
    - 非公開情報(本人と管理者のみ参照可能)
- プロフィール情報は2モデルに分割して管理する
  - `PublicProfile`: `userId`, `nickname`
  - `PrivateProfile`: `userId`, `realName`
- プロフィール編集画面では、入力欄の意味を明示する
  - ニックネーム: 対戦相手に表示される名前
  - 本名: 管理用の非公開情報
- イベントページにアクセスしたとき、ユーザーは以下のいずれかの操作を行う
  - ログイン済みの場合は、既存のユーザーを選択するステップを省略して結果の登録画面に遷移する
  - 未ログインの場合は、ログイン / 新規登録 を選択する
    - ログイン を選択した場合は、ログイン完了後に結果の登録画面に遷移する
    - 新規登録 を選択した場合は、新しいユーザーを登録し、登録完了後に結果の登録画面に遷移する

#### 試合結果

- 登録する試合結果の情報
  - 日付
  - 時刻
  - 勝者ユーザーID (`playerUserId`)
  - 敗者ユーザーID (`loserUserId`)
  - 対戦相手のニックネーム(入力補助/表示補助。`MatchResult` には保持しない)
  - ポイント数 (1,3,5... 25まで)
    - デフォルトは 5
  - JBSレーティング対象フラグ (true or false)
- 日付・時刻のタイムゾーンは JST 固定とする
- 試合結果の登録運用は「勝者が登録する」とする
- 試合結果の新規登録は、対象イベントの状態が `open` の場合のみ可能とする
- 対象イベントの状態が `close` の場合、既存のランキング・試合結果一覧の閲覧は可能だが新規登録は不可とする
- 登録した試合結果の編集ができる
  - ユーザーは、自分が登録した試合結果のみ修正できる
  - 管理者は、すべての試合結果を修正できる
- イベントページの試合結果一覧は、以下のカラムで表示する
  - 時刻
  - 勝ち(勝者ニックネーム)
  - 負け(敗者ニックネーム)
  - ポイント
  - JBS
  - 操作

#### 集計

- 以下の単位で、結果を集計し表示できる
  - イベント単位
  - 年度単位(4月開始、翌年3月終了)
  - All time
- 現行UIで表示しているのはイベント単位と年度単位で、All time は集計ロジックの対応範囲として扱う
- イベントページのランキング表示は「イベント(1日)」集計を利用し、対象イベントの登録済み試合結果のみを集計対象とする
- 表示指標は合計ポイント(勝者は加点、敗者は同ポイントを減点)とする
- 総ポイント数は、勝敗に関係なく、そのユーザーが対戦した試合のポイント合計とする
- 集計対象はすべての試合結果とし、`isJbsRated` が `false` の試合も含める
- 表示順はポイント合計の降順とし、同率の場合はニックネームを TypeScript(JavaScript)の文字列ソート順に従って昇順で表示する
- 集計機能は、集計範囲を指定して呼び出す共通仕様とする
- フロントエンドでは、同一のランキング表示コンポーネントを再利用し、範囲指定を切り替えて利用する
  - 現行UIではイベント単位・年度単位に適用している
  - All time は同ロジックで拡張可能な前提とする
- トップページには、当日基準で該当する年度(4月開始、翌年3月終了)の年間集計を表示する
  - 表示する年間集計は `scope = FISCAL_YEAR` とし、年度開始年を指定して取得する
  - `status = hide` のイベントに紐づく試合結果は年間集計の対象外とする
  - 年度の判定ルール
    - 当月が 4-12 月の場合は当年を年度開始年とする
    - 当月が 1-3 月の場合は前年を年度開始年とする
- All time 集計でも、`status = hide` のイベントに紐づく試合結果は対象外とする

### データモデル

#### Event

- 用途: イベントの基本情報を管理する
- 主な項目
  - `eventId` (string, PK): イベントID(公開用URL識別子として使用)
  - `name` (string, required): イベント名
  - `eventDate` (date, required): 開催日
  - `status` (enum, required): `open` / `close` / `hide` (デフォルト `open`)

#### PublicProfile

- 用途: 公開プロフィール情報を管理する
- 主な項目
  - `userId` (string, PK): Cognito `sub` と紐づく内部ユーザーID
  - `nickname` (string, required): 公開名

#### NicknameRegistry

- 用途: ニックネームの一意性を担保する予約キーを管理する
- 主な項目
  - `nicknameKey` (string, PK): 正規化済みニックネームキー
  - `userId` (string, required): キーを保持しているユーザーID

#### PrivateProfile

- 用途: 非公開プロフィール情報を管理する
- 主な項目
  - `userId` (string, PK): Cognito `sub` と紐づく内部ユーザーID
  - `realName` (string, required): 非公開情報(本人・管理者のみ参照可)

#### MatchResult

- 用途: 試合結果を管理する
- 主な項目
  - `resultId` (string, PK): 試合結果ID
  - `eventId` (string, required): 対象イベントID
  - `playerUserId` (string, required): 勝者(登録者)のユーザーID
  - `loserUserId` (string, required): 敗者のユーザーID
  - `matchDate` (date, required): 試合日
  - `matchTime` (time, required): 試合時刻
  - `point` (number, required): 1-25 の奇数、デフォルト 5
  - `isJbsRated` (boolean, required): JBSレーティング対象フラグ

#### 制約・インデックス方針

- `eventId` は一意な文字列IDを採用する
- `MatchResult` は `eventId + playerUserId + loserUserId + matchDate + matchTime` で重複検知する
- 現実装のスキーマでは、各モデルは主キー(identifier)のみを定義し、追加の複合インデックスは定義しない
- `createdAt` / `updatedAt` は Amplify Data の自動管理項目として扱い、アプリ固有項目としては定義しない

### 画面ルーティング

- `/` : ホーム
- `/profile` : プロフィール編集
- `/events/create` : イベント作成(管理者向け)
- `/events/:eventId` : イベント詳細(試合結果登録・イベント内ランキング)

## 実装

AWS Amplify を使って実装する
