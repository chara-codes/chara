type PreviewProcess = {
  projectPath: string;
  process: any;
  port: number;
};

let currentPreview: PreviewProcess | null = null;

export function getPreviewState() {
  return currentPreview;
}

export function setPreviewState(preview: PreviewProcess) {
  currentPreview = preview;
}

export function clearPreviewState() {
  if (currentPreview?.process) {
    currentPreview.process.kill();
  }
  currentPreview = null;
}
