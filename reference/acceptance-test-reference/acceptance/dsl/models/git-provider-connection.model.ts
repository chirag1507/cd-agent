export interface GitProviderConnectionDetails {
  provider: string;
  organizationName?: string;
  accessToken?: string;
}

export interface GitProviderConnectionResult {
  isSuccessful: boolean;
  errorMessage?: string;
}
