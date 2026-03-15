/**
 * Shortens a full address for display (e.g. first 2-3 parts by comma).
 * "La Bombonera, Brandsen 805, La Boca, 1162, ..." → "La Bombonera, La Boca, Buenos Aires"
 */
export function shortAddress(fullAddress: string, maxParts = 3, maxLength = 70): string {
  const trimmed = fullAddress.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  const short = parts.slice(0, maxParts).join(', ');
  return short.length > maxLength ? short.slice(0, maxLength - 1).trim() + '…' : short;
}
