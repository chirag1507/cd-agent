import {
	GitAuthenticationService,
	GitProviderOAuthTokenData
} from '../../domain/interfaces/services/git-authentication.service';

interface GitHubTokenResponse {
	access_token: string;
	token_type: string;
	scope: string;
	error?: string;
	error_description?: string;
}
export class GitHubAuthService implements GitAuthenticationService {
	private readonly clientId: string;
	private readonly clientSecret: string;

	constructor() {
		this.clientId = process.env.CLIENT_ID_GITHUB || '';
		this.clientSecret = process.env.CLIENT_SECRET_GITHUB || '';
	}

	async authenticateCallback(code: string): Promise<GitProviderOAuthTokenData> {
		try {
			if (!this.clientId || !this.clientSecret) {
				throw new Error('GitHub OAuth client credentials are not configured');
			}

			const tokenResponse = await this.exchangeCodeForToken(code);

			if (!tokenResponse.access_token) {
				throw new Error(
					tokenResponse.error_description || 'Failed to exchange code for token'
				);
			}

			return {
				accessToken: tokenResponse.access_token,
				provider: 'GITHUB'
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Git provider authentication failed: ${error.message}`);
			}
			throw new Error('Unknown error occurred during Git provider authentication');
		}
	}

	private async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
		const response = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code: code
			})
		});

		if (!response.ok) {
			const errorData = (await response.json()) as GitHubTokenResponse;
			throw new Error(errorData.error_description || 'Token exchange failed');
		}

		return (await response.json()) as GitHubTokenResponse;
	}
	getAuthorizationUrl(userId: string): string {
		const redirectUri = process.env.REPO_ACCESS_CALLBACK_URL_GITHUB || '';
		const scope = 'repo,read:org';
		return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&scope=${scope}&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=consent`;
	}
}
