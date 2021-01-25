import firebase from 'firebase/app';
import { getAppConfig } from '../app-config';
import { HttpRequestError } from '../errors/HttpRequestError';

export interface HttpRequestOptions {
  urlPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export async function makeHttpRequest(requestOptions: HttpRequestOptions, body?: unknown): Promise<Response> {
  const url = `${getAppConfig().apiUrl}${requestOptions.urlPath}`;
  const idToken = await firebase.auth().currentUser?.getIdToken();

  const headers = {
    Authorization: `Bearer ${idToken}`,
    Accept: 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const httpRes = await fetch(url, {
    headers,
    method: requestOptions.method,
    body: body ? JSON.stringify(body) : undefined,
  });

  return httpRes;
}

export async function makeHttpJsonRequest<T>(requestOptions: HttpRequestOptions, body?: unknown): Promise<T> {
  const httpRes = await makeHttpRequest(requestOptions, body);

  if (!httpRes.ok) {
    throw new HttpRequestError('HTTP request failed', httpRes);
  }

  const result = await httpRes.json();
  return result;
}
