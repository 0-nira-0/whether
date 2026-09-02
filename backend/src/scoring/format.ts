const SHOWN_DECIMALS = 1;

export function formatNumber(value: number, decimals?: number): string {
  const digits =
    decimals === undefined
      ? String(Number(value.toFixed(SHOWN_DECIMALS)))
      : value.toFixed(decimals);
  return digits.replace('-', '−');
}

export function formatMeasurement(value: number, unit: string, decimals?: number): string {
  return `${formatNumber(value, decimals)} ${unit}`;
}
