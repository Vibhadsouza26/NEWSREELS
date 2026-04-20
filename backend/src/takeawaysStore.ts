/** Simple in-memory takeaways store (no disk persistence — useless on Vercel) */

const store = new Map<string, string[]>();

/** Set a single entry */
export function setEntry(id: string, takeaways: string[]): void {
  store.set(id, takeaways);
}
