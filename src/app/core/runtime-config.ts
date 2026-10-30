import {
  InjectionToken
} from '@angular/core';

export interface RuntimeConfig {
  apiBaseUrl: string;
}

export const RUNTIME_CONFIG =
  new InjectionToken<RuntimeConfig>(
    'runtimeConfig',
    {
      providedIn: 'root',
      factory: () => ({
        apiBaseUrl: ''
      })
    }
  );

export async function loadRuntimeConfig():
  Promise<RuntimeConfig> {
  const response =
    await fetch('/runtime-config.json', {
      cache: 'no-store'
    });

  if (!response.ok) {
    throw new Error(
      `Could not load runtime configuration (${response.status}).`
    );
  }

  const config: unknown =
    await response.json();

  if (
    typeof config !== 'object' ||
    config === null ||
    !('apiBaseUrl' in config) ||
    typeof config.apiBaseUrl !== 'string'
  ) {
    throw new Error(
      'Runtime configuration must contain an apiBaseUrl string.'
    );
  }

  const apiBaseUrl =
    config.apiBaseUrl.trim();

  if (!apiBaseUrl) {
    return {
      apiBaseUrl: ''
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error(
      'The configured API_BASE_URL must be an absolute HTTP or HTTPS URL.'
    );
  }

  if (
    !['http:', 'https:'].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      'The configured API_BASE_URL must be an HTTP or HTTPS URL without credentials, query parameters, or a fragment.'
    );
  }

  return {
    apiBaseUrl: parsedUrl.href.replace(/\/+$/, '')
  };
}
