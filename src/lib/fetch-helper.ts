/**
 * Helper para fazer fetch com basePath automaticamente adicionado
 * Já que o basePath é /escala, todas as requisições fetch devem ter esse prefixo
 */

const BASE_PATH = "/escala";

export function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const fullPath = path.startsWith("/") ? `${BASE_PATH}${path}` : `${BASE_PATH}/${path}`;
  return fetch(fullPath, options);
}

export function apiUrl(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : `${BASE_PATH}/${path}`;
}
