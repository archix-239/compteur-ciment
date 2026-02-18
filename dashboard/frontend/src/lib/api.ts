const API_BASE_URL = `http://${window.location.hostname}:8000`;
const WS_BASE_URL = `ws://${window.location.hostname}:8000`;

export const API_URL = API_BASE_URL;
export const WS_URL = `${WS_BASE_URL}/ws`;
export const WS_VIDEO_URL = `${WS_BASE_URL}/ws/video`;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}
