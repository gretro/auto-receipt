export function downloadBlobFile(file: ArrayBuffer, filename: string): void {
  const blob = new Blob([file]);
  const downloadUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.setAttribute('href', downloadUrl);
  anchor.setAttribute('download', filename);
  anchor.click();

  window.URL.revokeObjectURL(downloadUrl);
}
