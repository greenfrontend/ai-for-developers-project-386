import { client } from './generated/client.gen';

const defaultBaseUrl = 'http://localhost:4010';

export function configureApiClient() {
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  });
}
