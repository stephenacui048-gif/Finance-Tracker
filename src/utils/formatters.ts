/**
 * Formatting helpers for Indonesian Student Finance Tracker
 */

export function formatIDR(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(absAmount);

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatCompactIDR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  let result = '';

  if (abs >= 1_000_000_000) {
    result = `${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  } else if (abs >= 1_000_000) {
    result = `${(abs / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  } else if (abs >= 1_000) {
    result = `${Math.round(abs / 1_000)} rb`;
  } else {
    result = `${abs}`;
  }

  return isNegative ? `-Rp ${result}` : `Rp ${result}`;
}

export function formatDateID(dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthsLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();
  const dayName = days[date.getDay()];

  if (format === 'short') {
    return `${day} ${monthsShort[monthIdx]}`;
  }
  if (format === 'long') {
    return `${dayName}, ${day} ${monthsLong[monthIdx]} ${year}`;
  }
  return `${day} ${monthsShort[monthIdx]} ${year}`;
}

export function getMonthNameID(monthIdx: number, format: 'short' | 'long' = 'long'): string {
  const monthsLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return format === 'short' ? monthsShort[monthIdx] : monthsLong[monthIdx];
}

export function formatPercent(rate: number, decimals: number = 1): string {
  if (isNaN(rate) || !isFinite(rate)) return '0%';
  return `${(rate * 100).toFixed(decimals).replace('.', ',')}%`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

