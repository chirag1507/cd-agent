import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';
import { randomUUID } from 'crypto';

export interface GitProviderAuthProps {
	id: string;
	userId: string;
	accessToken: GitProviderAccessToken;
	provider: string;
	createdAt: Date;
	updatedAt: Date;
}

export class GitProviderAuth {
	private props: GitProviderAuthProps;

	constructor(props: GitProviderAuthProps) {
		this.props = props;
	}

	static create(
		props: Omit<GitProviderAuthProps, 'id' | 'createdAt' | 'updatedAt'>
	): GitProviderAuth {
		return new GitProviderAuth({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	get userId(): string {
		return this.props.userId;
	}

	get accessToken(): GitProviderAccessToken {
		return this.props.accessToken;
	}

	get provider(): string {
		return this.props.provider;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	get id(): string {
		return this.props.id;
	}
}
