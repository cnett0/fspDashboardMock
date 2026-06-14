export function buildQuery(params: Record<string, string | boolean | undefined | null>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  return q ? `?${q}` : ''
}

export async function get<T>(_url: string): Promise<T> {
  throw new Error('Mock: use api/* functions instead')
}

export async function getRaw<T>(_url: string): Promise<T> {
  throw new Error('Mock: use api/* functions instead')
}

export async function post<T>(_url: string, _body: unknown): Promise<T> {
  throw new Error('Mock')
}

export async function postRaw<T>(_url: string, _body: unknown): Promise<T> {
  throw new Error('Mock')
}

export async function put<T>(_url: string, _body: unknown): Promise<T> {
  throw new Error('Mock')
}

export async function del(_url: string): Promise<void> { }
