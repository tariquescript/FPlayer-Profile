const EM_DASH = '—';

/** €220.0m / €900k / €0 — Transfermarkt values are plain euros. */
export function money(value, { compact = true } = {}) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return EM_DASH;
  const signed = Number(value);
  if (signed === 0) return '€0';

  // Club transfer balances are negative for net spenders.
  if (signed < 0) return `-${money(-signed, { compact })}`;
  const amount = signed;

  if (!compact) return `€${amount.toLocaleString('en-GB')}`;
  if (amount >= 1_000_000_000) return `€${(amount / 1_000_000_000).toFixed(2)}bn`;
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `€${millions >= 100 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  if (amount >= 1_000) return `€${Math.round(amount / 1_000)}k`;
  return `€${amount}`;
}

/** Transfer fees carry sentinel-ish values for loans and free moves. */
export function fee(value) {
  if (value === null || value === undefined || value === '') return EM_DASH;
  if (typeof value === 'string') return value;
  if (value === 0) return 'Free';
  return money(value);
}

export function date(value, { style = 'medium' } = {}) {
  if (!value) return EM_DASH;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleDateString('en-GB', {
    day: style === 'short' ? undefined : '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function year(value) {
  if (!value) return EM_DASH;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : String(parsed.getFullYear());
}

export function height(cm) {
  if (!cm) return EM_DASH;
  const value = Number(String(cm).replace(/[^\d]/g, ''));
  if (!value) return String(cm);
  return `${(value / 100).toFixed(2)} m`;
}

export function foot(value) {
  if (!value) return EM_DASH;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function shirt(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits || null;
}

export function list(values, fallback = EM_DASH) {
  if (!Array.isArray(values) || values.length === 0) return fallback;
  return values.join(', ');
}

/** First and last name initials: "Erling Braut Haaland" -> "EH". */
export function initials(name) {
  const parts = (name || '').split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** "3 years left" / "expired" — contract urgency at a glance. */
export function until(value) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const months = Math.round((target - Date.now()) / (30.44 * 24 * 3600 * 1000));
  if (months < 0) return 'expired';
  if (months < 1) return 'expiring';
  if (months < 12) return `${months} mo left`;
  const years = Math.floor(months / 12);
  return `${years} yr${years > 1 ? 's' : ''} left`;
}

/** Percentage change between the first and last point of a value history. */
export function growth(history) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const first = Number(history[0].marketValue);
  const last = Number(history[history.length - 1].marketValue);
  if (!first || !last) return null;
  return ((last - first) / first) * 100;
}

export function compactNumber(value) {
  if (value === null || value === undefined) return EM_DASH;
  return Number(value).toLocaleString('en-GB');
}

export { EM_DASH };
