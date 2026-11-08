/**
 * E2Eテスト実行前のビルド（npm run test:e2e の pretest:e2e から呼ばれる）
 *
 * ビルドの入力（ソースなど）が前回このスクリプトでビルドしたときから変わっていなければ、ビルドを省略する。
 * - ソース（src。テストを除く）、index.html、各種設定ファイル：内容のハッシュで比較する
 * - public（地図タイルなど、ファイル数が多く容量が大きい）：ファイルのパス・サイズ・更新日時で比較する
 * - 前回ビルドした後に dist が別の手段（手動ビルド、npm run app:dev など）で書き換えられた場合も、ビルドし直す
 *
 * 環境変数 E2E_FORCE_BUILD=1 を指定した場合は、常にビルドする。
 */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ビルド結果のハッシュを記録するファイル
const STAMP_PATH = path.join("dist", ".e2e-build-stamp.json");

// ビルドの出力（存在しない、または前回ビルド後に書き換えられた場合はビルドし直す）
const OUTPUT_FILES = [path.join("dist", "index.html"), path.join("dist", "electron", "main", "main.js")];

// 内容で比較する入力
const CONTENT_INPUTS = ["src", "index.html", "vite.config.mjs", "tsconfig.json", "package.json", "package-lock.json"];

// ファイルのパス・サイズ・更新日時で比較する入力
const STAT_INPUTS = ["public"];

// 入力から除外するディレクトリ（ビルド対象外のテスト）
const EXCLUDE_DIRS = [path.join("src", "__tests__")];

/**
 * 指定のパス配下のファイルを、パスの昇順で返す
 */
const listFiles = (target) => {
  if (!fs.existsSync(target)) {
    return [];
  }
  if (EXCLUDE_DIRS.includes(path.normalize(target))) {
    return [];
  }

  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return [target];
  }

  return fs
    .readdirSync(target)
    .sort()
    .flatMap((name) => listFiles(path.join(target, name)));
};

/**
 * ビルドの入力のハッシュを算出する
 */
const calcInputHash = () => {
  const hash = crypto.createHash("sha256");

  for (const file of CONTENT_INPUTS.flatMap(listFiles)) {
    hash.update(`${file.replaceAll("\\", "/")}\n`);
    hash.update(fs.readFileSync(file));
  }
  for (const file of STAT_INPUTS.flatMap(listFiles)) {
    const stat = fs.statSync(file);
    hash.update(`${file.replaceAll("\\", "/")}\n${stat.size}\n${stat.mtimeMs}\n`);
  }

  return hash.digest("hex");
};

/**
 * ビルドの出力の更新日時を返す（存在しない場合はnull）
 */
const getOutputMtimes = () => {
  return OUTPUT_FILES.map((file) => (fs.existsSync(file) ? fs.statSync(file).mtimeMs : null));
};

/**
 * 前回のビルドの記録を読み込む（ない、または壊れている場合はnull）
 */
const readStamp = () => {
  try {
    return JSON.parse(fs.readFileSync(STAMP_PATH, "utf-8"));
  } catch {
    return null;
  }
};

/**
 * ビルドを省略できるか判定し、省略できない場合はその理由を返す
 */
const getRebuildReason = (inputHash) => {
  if (process.env.E2E_FORCE_BUILD === "1") {
    return "E2E_FORCE_BUILD=1 が指定されています";
  }

  const outputMtimes = getOutputMtimes();
  if (outputMtimes.some((mtime) => mtime === null)) {
    return "ビルド結果がありません";
  }

  const stamp = readStamp();
  if (!stamp) {
    return "前回のビルドの記録がありません";
  }
  if (stamp.inputHash !== inputHash) {
    return "ソースが前回のビルドから変更されています";
  }
  if (JSON.stringify(stamp.outputMtimes) !== JSON.stringify(outputMtimes)) {
    return "前回のビルドの後に、ビルド結果が別の手段で更新されています";
  }

  return null;
};

/**
 * npm スクリプトを実行する（失敗した場合はプロセスを終了する）
 */
const runNpmScript = (script) => {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const inputHash = calcInputHash();
const reason = getRebuildReason(inputHash);

if (reason === null) {
  console.log("[e2e-prebuild] ビルド結果が最新のため、ビルドを省略します。（強制する場合は E2E_FORCE_BUILD=1）");
  process.exit(0);
}

console.log(`[e2e-prebuild] ${reason}。ビルドします。`);
runNpmScript("vite:build");
runNpmScript("ts");

// ビルド結果を記録する
fs.writeFileSync(STAMP_PATH, JSON.stringify({ inputHash, outputMtimes: getOutputMtimes() }, null, 2));
console.log("[e2e-prebuild] ビルドが完了しました。");
