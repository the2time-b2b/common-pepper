/**
 * Checks if channel username conforms to Twitch's basic username requirments.
 * @param channel Username of the Twitch channel.
 */
export function checkChannelName(channel: string): boolean {
  if (channel.match(/^[a-zA-Z0-9_]{4,25}$/)) return true;
  return false;
}

