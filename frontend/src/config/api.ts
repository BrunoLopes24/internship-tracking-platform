/** API URL helper. In dev, Vite proxy handles /api. In prod, use env var. */

const BASE = import.meta.env.VITE_API_URL || '/api';

export function apiUrl(path: string): string {
    // Ensure path starts with /
    const normalised = path.startsWith('/') ? path : `/${path}`;
    return `${BASE}${normalised}`;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(apiUrl(path), {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}
