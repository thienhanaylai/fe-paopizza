/**
 * Parse crust options from variant data.
 * Handles: plain strings, arrays, space/comma/pipe-delimited strings,
 * and compact concatenated values (e.g. "traditionalthin" → ["traditional", "thin"])
 */
export const parseCrustOptions = (value: string | string[] | undefined): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap(item => parseCrustOptions(item))));
  }

  const raw = value.trim();
  if (!raw) return [];

  const splitByDelimiter = raw
    .split(/[\s,|/;]+/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  if (splitByDelimiter.length > 1) {
    return Array.from(new Set(splitByDelimiter));
  }

  const compact = raw.replace(/\s+/g, "").toLowerCase();
  const mergedMatches = compact.match(/traditional|thin|medium|thick|stuffed|cheese/g);

  if (mergedMatches && mergedMatches.length > 1 && mergedMatches.join("") === compact) {
    return Array.from(new Set(mergedMatches));
  }

  return [raw.toLowerCase()];
};
