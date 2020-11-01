import { AuthenticatedUser } from '../context/auth.context';
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
  const url = `http://localhost:3001/listDonations?year=${fiscalYear}`;
  const idToken = await auth?.firebaseUser.getIdToken();

  const httpRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: 'application/json',
    },
  });

  if (!httpRes.ok) {
    // TODO: Use an actual well-known error
    throw new Error('HTTP request return a non-200 response');
  }

  const result = await httpRes.json();
  return result;
}
