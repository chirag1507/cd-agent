import { PrismaClient } from '@prisma/client';
import { PrismaGitProviderRepository } from '../repositories/git-provider.repository';
import { GitProviderAuth } from '../../domain/entities/git-provider';
import { GitProviderAuthBuilder } from '../../__test__/builders/git-provider-auth.builder';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';

describe('PrismaGitProviderAuthRepository (Narrow Integration)', () => {
	let prisma: PrismaClient;
	let gitProviderAuthRepository: PrismaGitProviderRepository;
	let createdGitProviderIds: string[] = [];

	const saveGitProviderAndTrack = async (gitProvider: GitProviderAuth): Promise<void> => {
		await gitProviderAuthRepository.save(gitProvider);
		createdGitProviderIds.push(gitProvider.id);
	};

	beforeAll(async () => {
		prisma = new PrismaClient();
		await prisma.$connect();
		gitProviderAuthRepository = new PrismaGitProviderRepository();
	});

	beforeEach(async () => {
		createdGitProviderIds = [];
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});
	afterEach(async () => {
		if (createdGitProviderIds.length > 0) {
			await prisma.gitProviderConnection.deleteMany({
				where: { id: { in: createdGitProviderIds } }
			});
		}
	});

	describe('save', () => {
		it('should save a new git provider connection to the database', async () => {
			const newGitProvider = new GitProviderAuthBuilder()
				.withUserId('test-user-id')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'test-access-token',
						isEncrypted: false
					})
				)
				.withGitProvider('GITHUB')
				.create();
			await saveGitProviderAndTrack(newGitProvider);

			const retrievedProvider = await gitProviderAuthRepository.findByUserId('test-user-id');

			expect(retrievedProvider).not.toBeNull();
			expect(retrievedProvider?.id).toBe(newGitProvider.id);
			expect(retrievedProvider?.userId).toBe(newGitProvider.userId);
			expect(retrievedProvider?.accessToken.getDecryptedValue()).toBe(
				newGitProvider.accessToken.getDecryptedValue()
			);
			expect(retrievedProvider?.provider).toBe(newGitProvider.provider);
		});
	});

	describe('findByUserId', () => {
		it('should return a git provider entity when a connection with the given userId exists', async () => {
			const newGitProvider = new GitProviderAuthBuilder()
				.withUserId('find-me-user-id')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'find-me-token', isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.create();

			await saveGitProviderAndTrack(newGitProvider);

			const foundGitProvider =
				await gitProviderAuthRepository.findByUserId('find-me-user-id');

			expect(foundGitProvider).toBeInstanceOf(GitProviderAuth);
			expect(foundGitProvider?.id.toString()).toBe(newGitProvider.id.toString());
			expect(foundGitProvider?.userId).toBe(newGitProvider.userId);
			expect(foundGitProvider?.accessToken.getDecryptedValue()).toBe(
				newGitProvider.accessToken.getDecryptedValue()
			);
			expect(foundGitProvider?.provider).toBe(newGitProvider.provider);
		});

		it('should return null when no connection with the given userId exists', async () => {
			const foundGitProvider =
				await gitProviderAuthRepository.findByUserId('non-existent-user-id');

			expect(foundGitProvider).toBeNull();
		});
	});

	describe('delete', () => {
		it('should delete git provider connections successfully for a given user id', async () => {
			const userId = 'delete-test-user-id';
			const newGitProvider = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'delete-me-token', isEncrypted: false })
				)
				.create();

			await saveGitProviderAndTrack(newGitProvider);

			const connectionBeforeDelete = await gitProviderAuthRepository.findByUserId(userId);
			expect(connectionBeforeDelete).not.toBeNull();
			expect(connectionBeforeDelete?.userId).toBe(userId);
			expect(connectionBeforeDelete?.accessToken.getDecryptedValue()).toBe(
				newGitProvider.accessToken.getDecryptedValue()
			);

			await gitProviderAuthRepository.delete(userId);

			const foundConnection = await gitProviderAuthRepository.findByUserId(userId);
			expect(foundConnection).toBeNull();
		});
	});
});
