import { CorrespondenceType } from '../models/correspondence';
import { DeepPartial } from '../models/deep-partial';
import { Donation } from '../models/donation';
import { HttpRequestOptions, makeHttpRequest } from './http.api';

export interface FetchDonationsResponse {
  fiscalYear: string;
  donations: Donation[];
  count: number;
}

async function fetchDonations(fiscalYear: string): Promise<FetchDonationsResponse> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `listDonations?year=${fiscalYear}`,
    method: 'GET',
  };

  const result = await makeHttpRequest<FetchDonationsResponse>(requestOptions);
  return result;
}

async function fetchDonation(donationId: string): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `getDonation?id=${donationId}`,
    method: 'GET',
  };

  const result = await makeHttpRequest<Donation>(requestOptions);
  return result;
}

async function sendCorrespondence(donationId: string, correspondenceType: CorrespondenceType): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `sendCorrespondence`,
    method: 'POST',
  };

  const request = {
    donationId,
    correspondenceType,
  };

  await makeHttpRequest(requestOptions, request);
  return await fetchDonation(donationId);
}

async function patchDonation(
  donationId: string,
  donationPatch: DeepPartial<Donation>,
  generateReceipt: boolean,
): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: 'patchDonation',
    method: 'PATCH',
  };

  const request = {
    donation: {
      ...donationPatch,
      id: donationId,
    },
    generateReceipt,
  };

  const result = await makeHttpRequest<Donation>(requestOptions, request);
  return result;
}

export const httpApi = {
  fetchDonations,
  fetchDonation,
  sendCorrespondence,
  patchDonation,
};
