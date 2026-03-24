export async function fetchText(path: string): Promise<string> {
  const res = await fetch(path);

  if (!res.ok) {
    throw new Error(`HTTP ${  res.status}`);
  }

  return res.text();
}
