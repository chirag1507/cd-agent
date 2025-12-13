export interface GitProviderOAuthTokenData {
	accessToken: string;
	provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
}

export interface GitAuthenticationService {
	authenticateCallback(code: string): Promise<GitProviderOAuthTokenData>;
	getAuthorizationUrl(userId: string): string;
}
