import { HttpRequestError } from '../errors/HttpRequestError';
import { CorrespondenceType } from '../models/correspondence';
import { DeepPartial } from '../models/deep-partial';
import { Donation } from '../models/donation';
import { HttpRequestOptions, makeHttpJsonRequest, makeHttpRequest } from './http.api';

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

  const result = await makeHttpJsonRequest<FetchDonationsResponse>(requestOptions);
  return result;
}

async function fetchDonation(donationId: string): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `getDonation?id=${donationId}`,
    method: 'GET',
  };

  const result = await makeHttpJsonRequest<Donation>(requestOptions);
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

  await makeHttpJsonRequest(requestOptions, request);
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

  const result = await makeHttpJsonRequest<Donation>(requestOptions, request);
  return result;
}

async function downloadReceipt(donationId: string, documentId: string): Promise<ArrayBuffer> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `downloadReceipt?donationId=${donationId}&documentId=${documentId}`,
    method: 'GET',
  };

  const res = await makeHttpRequest(requestOptions);

  if (!res.ok) {
    throw new HttpRequestError('HTTP request failed', res);
  }

  const result = await res.arrayBuffer();
  return result;
}

export const httpApi = {
  fetchDonations,
  fetchDonation,
  sendCorrespondence,
  patchDonation,
  downloadReceipt,
};
