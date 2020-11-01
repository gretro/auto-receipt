import { getAppConfig } from '../app-config';
import { AuthenticatedUser } from '../context/auth.context';
import { HttpRequestError } from '../errors/HttpRequestError';
import { Donation } from '../models/donation';

export interface FetchDonationsResponse {
  fiscalYear: string;
  donations: Donation[];
  count: number;
}

export async function fetchDonations(
  fiscalYear: number,
  auth: AuthenticatedUser | null | undefined,
): Promise<FetchDonationsResponse> {
  const url = `${getAppConfig().apiUrl}listDonations?year=${fiscalYear}`;
  const idToken = await auth?.firebaseUser.getIdToken();

  const httpRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    },
  });

  if (!httpRes.ok) {
    throw new HttpRequestError('Could not fetch donations', httpRes);
  }

  const result = await httpRes.json();
  return result;
}
