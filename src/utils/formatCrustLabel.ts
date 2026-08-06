const CRUST_LABELS: Record<string, string> = {
  thin: "Mỏng",
  medium: "Vừa",
  thick: "Dày",
};

export function formatCrustLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  return CRUST_LABELS[normalized] ?? value.replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
