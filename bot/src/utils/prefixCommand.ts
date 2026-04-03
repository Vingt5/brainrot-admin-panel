export interface ParsedPrefixCommand {
  name: string;
  args: string[];
}

export function parsePrefixCommand(content: string, prefix: string): ParsedPrefixCommand | null {
  const trimmedContent = content.trim();

  if (!trimmedContent.startsWith(prefix)) {
    return null;
  }

  const rawCommand = trimmedContent.slice(prefix.length).trim();

  if (!rawCommand) {
    return null;
  }

  const [name, ...args] = rawCommand.split(/\s+/);

  if (!name) {
    return null;
  }

  return {
    name: name.toLowerCase(),
    args
  };
}
