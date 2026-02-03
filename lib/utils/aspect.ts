export function computeScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const offsetX = (targetWidth - width) / 2;
  const offsetY = (targetHeight - height) / 2;
  return { scale, width, height, offsetX, offsetY };
}
