import {
	GitAuthenticationService,
	GitProviderOAuthTokenData
} from '../../domain/interfaces/services/git-authentication.service';

export class GithubAuthenticationServiceStub implements GitAuthenticationService {
	private static authenticateState: {
		success: boolean;
		data?: { accessToken: string; provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET' };
	} = {
		success: true,
		data: { accessToken: 'xyz', provider: 'GITHUB' }
	};
	private static urlState: { success: boolean } = { success: true };
	static setAuthenticateState(state: {
		success: boolean;
		data?: { accessToken: string; provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET' };
	}): void {
		GithubAuthenticationServiceStub.authenticateState.success = state.success;

		if (state.data) {
			GithubAuthenticationServiceStub.authenticateState.data = state.data;
		}
	}

	static setUrlState(state: { success: boolean }): void {
		GithubAuthenticationServiceStub.urlState.success = state.success;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async authenticateCallback(code: string): Promise<GitProviderOAuthTokenData> {
		if (!GithubAuthenticationServiceStub.authenticateState.success) {
			throw new Error('Git provider authentication failed');
		}
		return {
			accessToken: GithubAuthenticationServiceStub.authenticateState.data?.accessToken || '',
			provider: GithubAuthenticationServiceStub.authenticateState.data?.provider || 'GITHUB'
		};
	}

	getAuthorizationUrl(userId: string): string {
		if (!GithubAuthenticationServiceStub.urlState.success) {
			throw new Error('Failed to generate URL');
		}
		const mockCode = `test_code`;
		const mockState = userId;

		return `${process.env.BACKEND_URL}/api/git-provider/oauth/callback?code=${mockCode}&state=${mockState}`;
	}
}
