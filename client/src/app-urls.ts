export const appUrls = {
  root: () => '/',
  donations: () => ({
    root: () => '/donations',
    forFiscalYear: (fiscalYear: string) => `/donations/${fiscalYear}`,
    forDonation: (fiscalYear: string, donationId: string) => `/donations/${fiscalYear}/${donationId}`,
  }),
} as const;
