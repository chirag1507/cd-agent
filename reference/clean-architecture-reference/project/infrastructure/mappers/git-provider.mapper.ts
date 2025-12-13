import { GitProviderAuth } from '../../domain/entities/git-provider';
import { Prisma, GitProviderConnection as PrismaGitProviderConnection } from '@prisma/client';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';

export class GitProviderMapper {
	public static toPersistence(
		gitProviderAuth: GitProviderAuth
	): Prisma.GitProviderConnectionCreateInput {
		return {
			id: gitProviderAuth.id,
			userId: gitProviderAuth.userId,
			accessToken: gitProviderAuth.accessToken.getEncryptedValue(),
			provider: gitProviderAuth.provider,
			refreshToken: null,
			createdAt: gitProviderAuth.createdAt,
			updatedAt: gitProviderAuth.updatedAt
		};
	}

	public static toDomain(gitProviderAuth: PrismaGitProviderConnection): GitProviderAuth {
		const accessToken = GitProviderAccessToken.create({
			value: gitProviderAuth.accessToken,
			isEncrypted: true
		});

		return new GitProviderAuth({
			id: gitProviderAuth.id,
			userId: gitProviderAuth.userId,
			accessToken: accessToken,
			provider: gitProviderAuth.provider,
			createdAt: gitProviderAuth.createdAt,
			updatedAt: gitProviderAuth.updatedAt
		});
	}
}
