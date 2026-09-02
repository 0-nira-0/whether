export function formatNumber(value: number, decimals = 0): string {
  return value.toFixed(decimals).replace('-', '−');
}

export function formatMeasurement(value: number, unit: string, decimals = 0): string {
  return `${formatNumber(value, decimals)} ${unit}`;
}
