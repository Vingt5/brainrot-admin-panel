export function getPreferredDisplayName(username: string, globalName: string | null): string {
  return globalName ?? username;
}
