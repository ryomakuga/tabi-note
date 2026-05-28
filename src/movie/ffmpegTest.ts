import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

// FFmpeg を読み込んで準備完了させるだけの動作確認用関数
// ローカル(public/ffmpeg/)のcore/wasm/workerを toBlobURL 経由で読み込む(CDN不使用)
export async function testLoadFFmpeg(): Promise<string> {
  const ffmpeg = new FFmpeg();

  // 進捗ログをコンソールに出す(読み込み状況の確認用)
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });

  const baseURL = "/ffmpeg";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    classWorkerURL: await toBlobURL(`${baseURL}/ffmpeg-worker.js`, "text/javascript"),
  });

  return "FFmpeg loaded OK";
}
