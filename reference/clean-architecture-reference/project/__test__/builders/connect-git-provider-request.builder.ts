import { ConnectGitProviderRequest } from '../../application/use-cases/connect-git-provider/connect-git-provider.types';

export class ConnectGitProviderRequestBuilder {
	private request: ConnectGitProviderRequest = {
		code: 'default-auth-code',
		userId: 'default-user-id'
	};

	withCode(code: string): ConnectGitProviderRequestBuilder {
		this.request.code = code;
		return this;
	}

	withUserId(userId: string): ConnectGitProviderRequestBuilder {
		this.request.userId = userId;
		return this;
	}

	build(): ConnectGitProviderRequest {
		return { ...this.request };
	}
}
