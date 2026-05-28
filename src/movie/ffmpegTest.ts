import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

async function loadFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => console.log("[ffmpeg]", message));
  ffmpeg.on("progress", ({ progress }) =>
    console.log("[progress]", Math.round(progress * 100) + "%")
  );
  const origin = window.location.origin;
  console.log("LOAD: load()呼び出し直前");
  await ffmpeg.load({
    coreURL: new URL("/ffmpeg/ffmpeg-core.js", origin).href,
    wasmURL: new URL("/ffmpeg/ffmpeg-core.wasm", origin).href,
    classWorkerURL: new URL("/ffmpeg/esm/worker.js", origin).href,
  });
  console.log("LOAD: load()完了");
  return ffmpeg;
}

export async function testLoadFFmpeg(): Promise<string> {
  await loadFFmpeg();
  return "FFmpeg loaded OK";
}

function makeColorPng(color: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1280, 720);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );
}

export async function testMakeVideo(): Promise<string> {
  console.log("STEP 1: load開始");
  const ffmpeg = await loadFFmpeg();
  console.log("STEP 2: load完了");

  const png0 = await makeColorPng("#8B7355");
  const png1 = await makeColorPng("#5C7548");
  console.log("STEP 3: PNG生成完了", png0.size, png1.size);

  await ffmpeg.writeFile("img0.png", await fetchFile(png0));
  await ffmpeg.writeFile("img1.png", await fetchFile(png1));
  console.log("STEP 5: 書き込み完了");

  const files = await ffmpeg.listDir("/");
  console.log("STEP 6: ファイル一覧", files);

  console.log("STEP 7: exec開始");
  const ret = await ffmpeg.exec([
    "-framerate", "0.5",
    "-i", "img%d.png",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-vf", "fps=30",
    "out.mp4",
  ]);
  console.log("STEP 8: exec完了 ret=", ret);

  const data = await ffmpeg.readFile("out.mp4");
  console.log("STEP 9: readFile完了", (data as Uint8Array).length, "bytes");

  const blob = new Blob([data], { type: "video/mp4" });
  return URL.createObjectURL(blob);
}
