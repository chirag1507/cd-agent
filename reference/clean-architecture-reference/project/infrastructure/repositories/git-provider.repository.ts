import { GitProviderAuth } from '../../domain/entities/git-provider';
import { prisma } from '../../../shared/infrastructure/database/prisma-client';
import { GitProviderMapper } from '../mappers/git-provider.mapper';
import { GitProviderRepository } from '../../domain/interfaces/repositories/git-provider.repository';

export class PrismaGitProviderRepository implements GitProviderRepository {
	async save(gitProviderAuth: GitProviderAuth): Promise<void> {
		try {
			const persistenceData = GitProviderMapper.toPersistence(gitProviderAuth);
			await prisma.gitProviderConnection.create({
				data: persistenceData
			});
		} catch (error) {
			throw new Error(
				`Failed to save git provider connection: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async delete(userId: string) {
		try {
			await prisma.gitProviderConnection.deleteMany({
				where: { userId: userId }
			});
		} catch (error) {
			throw new Error(
				`Failed to delete git provider connection: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async findByUserId(userId: string): Promise<GitProviderAuth | null> {
		const gitProviderAuth = await prisma.gitProviderConnection.findFirst({
			where: { userId: userId }
		});
		if (!gitProviderAuth) {
			return null;
		}

		return GitProviderMapper.toDomain(gitProviderAuth);
	}
}
