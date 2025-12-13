import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';
import { GitProviderAuth, GitProviderAuthProps } from '../../domain/entities/git-provider';

export class GitProviderAuthBuilder {
	private props: Partial<GitProviderAuthProps> = {};

	withUserId(userId: string): GitProviderAuthBuilder {
		this.props.userId = userId;
		return this;
	}

	withAccessToken(accessToken: GitProviderAccessToken): GitProviderAuthBuilder {
		this.props.accessToken = accessToken;
		return this;
	}

	withGitProvider(provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET'): GitProviderAuthBuilder {
		this.props.provider = provider;
		return this;
	}

	build(): GitProviderAuth {
		const props: GitProviderAuthProps = {
			userId: this.props.userId || 'test-user-id',
			accessToken:
				this.props.accessToken ||
				GitProviderAccessToken.create({ value: 'test-access-token', isEncrypted: false }),
			provider: this.props.provider || 'GITHUB',
			id: this.props.id || 'test-id',
			createdAt: this.props.createdAt || new Date(),
			updatedAt: this.props.updatedAt || new Date()
		};
		return new GitProviderAuth(props);
	}

	create(): GitProviderAuth {
		const props = {
			userId: this.props.userId || 'test-user-id',
			accessToken:
				this.props.accessToken ||
				GitProviderAccessToken.create({ value: 'test-access-token', isEncrypted: true }),
			provider: this.props.provider || 'GITHUB'
		};
		return GitProviderAuth.create(props);
	}
}
