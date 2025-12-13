import { GitProviderOAuthTokenData } from '../../domain/interfaces/services/git-authentication.service';

export class GitProviderOAuthTokenResponseBuilder {
	private tokenResponse: GitProviderOAuthTokenData = {
		accessToken: 'default-access-token',
		provider: 'GITHUB'
	};

	withAccessToken(accessToken: string): GitProviderOAuthTokenResponseBuilder {
		this.tokenResponse.accessToken = accessToken;
		return this;
	}

	withProvider(
		provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET' = 'GITHUB'
	): GitProviderOAuthTokenResponseBuilder {
		this.tokenResponse.provider = provider;
		return this;
	}

	build(): GitProviderOAuthTokenData {
		return { ...this.tokenResponse };
	}
}
