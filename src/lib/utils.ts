// ============================================================
// Utility Functions — Formatting, pluralization, file sizes
// ============================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`;
}

export function truncateFilename(name: string, maxLength = 30): string {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf('.');
  if (ext === -1) return name.slice(0, maxLength - 3) + '...';
  const extension = name.slice(ext);
  const base = name.slice(0, ext);
  const maxBase = maxLength - extension.length - 3;
  return base.slice(0, maxBase) + '...' + extension;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return (value / total * 100).toFixed(1) + '%';
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function generateId(): string {
  return `imp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function delimiterLabel(d: string): string {
  switch (d) {
    case ',': return 'Comma separated';
    case '\t': return 'Tab separated';
    case ';': return 'Semicolon separated';
    case '|': return 'Pipe separated';
    default: return `Delimited by "${d}"`;
  }
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
