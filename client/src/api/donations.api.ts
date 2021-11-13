import { HttpRequestError } from '../errors/HttpRequestError';
import { CorrespondenceType } from '../models/correspondence';
import { DeepPartial } from '../models/deep-partial';
import { Donation } from '../models/donation';
import { CreateDonationDTO } from './donation-create.dto';
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

async function createDonation(dto: CreateDonationDTO): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `createCheque`,
    method: 'POST',
  };

  const result = await makeHttpJsonRequest<Donation>(requestOptions, dto);
  return result;
}

async function sendCorrespondence(donationId: string, correspondenceType: CorrespondenceType): Promise<Donation> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `sendCorrespondence`,
    method: 'POST',
  };

  const request = {
    toSend: [
      {
        donationId,
        correspondenceType,
      },
    ],
  };

  const response = await makeHttpRequest(requestOptions, request);

  if (response.ok) {
    return await fetchDonation(donationId);
  } else {
    throw new HttpRequestError('Http request failed', response);
  }
}

async function sendCorrespondenceInBulk(donationIds: string[], correspondenceType: CorrespondenceType): Promise<void> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `sendCorrespondence`,
    method: 'POST',
  };

  const request = {
    toSend: donationIds.map((donationId) => ({
      donationId,
      correspondenceType,
    })),
  };

  const response = await makeHttpRequest(requestOptions, request);
  if (!response.ok) {
    throw new HttpRequestError('Http request failed', response);
  }
}

async function forceGenerateReceipt(toGenerate: { donationId: string; sendEmail: boolean }[]): Promise<void> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `generatePdfReceipt`,
    method: 'POST',
  };

  const request = {
    toGenerate,
  };

  const response = await makeHttpRequest(requestOptions, request);
  if (!response.ok) {
    throw new HttpRequestError('Http request failed', response);
  }
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

async function bulkDownloadReceipts(toDownload: { donationId: string; documentId: string }[]): Promise<ArrayBuffer> {
  const requestOptions: HttpRequestOptions = {
    urlPath: `bulkExportReceipts`,
    method: 'POST',
  };

  const request = {
    receipts: toDownload,
  };

  const res = await makeHttpRequest(requestOptions, request);

  if (!res.ok) {
    throw new HttpRequestError('HTTP request failed', res);
  }

  const result = await res.arrayBuffer();
  return result;
}

export const httpApi = {
  fetchDonations,
  fetchDonation,
  createDonation,
  sendCorrespondence,
  sendCorrespondenceInBulk,
  forceGenerateReceipt,
  patchDonation,
  downloadReceipt,
  bulkDownloadReceipts,
};
