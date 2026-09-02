export function formatNumber(value: number): string {
  return String(Math.round(value)).replace('-', '−');
}

export function formatMeasurement(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}
