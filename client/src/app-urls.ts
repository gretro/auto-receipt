export const appUrls = {
  root: () => '/',
  donations: () => ({
    root: () => '/donations',
    forFiscalYear: (fiscalYear: string) => `/donations/${fiscalYear}`,
    createDonation: (fiscalYear: string) => `/donations/${fiscalYear}/new`,
    forDonation: (fiscalYear: string, donationId: string) => `/donations/${fiscalYear}/${donationId}`,
  }),
} as const;
