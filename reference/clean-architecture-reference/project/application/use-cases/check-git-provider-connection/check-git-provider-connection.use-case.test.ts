import { GitProviderAuth } from '../../../domain/entities/git-provider';
import { CheckGitProviderConnectionUseCase } from './check-git-provider-connection.use-case';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { CheckGitProviderConnectionError } from '../../../domain/errors/git-provider.error';
import { GitProviderAccessToken } from '../../../../shared/domain/value-objects/git-provider-access-token';

describe('CheckGitProviderConnectionUseCase', () => {
	let useCase: CheckGitProviderConnectionUseCase;
	let mockGitProviderRepository: {
		findByUserId: jest.Mock;
		save: jest.Mock;
		delete: jest.Mock;
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockGitProviderRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			delete: jest.fn()
		};

		useCase = new CheckGitProviderConnectionUseCase(mockGitProviderRepository);
	});

	describe('execute', () => {
		it('should return true when user has connected git provider', async () => {
			const userId = 'user-123';
			const expectedGitProviderAuth = GitProviderAuth.create({
				userId: userId,
				provider: 'github',
				accessToken: GitProviderAccessToken.create({
					value: 'github_access_token_123',
					isEncrypted: true
				})
			});

			mockGitProviderRepository.findByUserId.mockResolvedValue(expectedGitProviderAuth);

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(true);

			const { isConnected } = result.getValue();
			expect(isConnected).toBe(true);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should return false when user has not connected any git provider', async () => {
			const userId = 'user-456';
			mockGitProviderRepository.findByUserId.mockResolvedValue(null);

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(true);

			const { isConnected } = result.getValue();
			expect(isConnected).toBe(false);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should return failure when userId is empty string', async () => {
			const userId = '';

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(false);

			const error = result.error();
			expect(error).toBeInstanceOf(ValidationError);

			expect(mockGitProviderRepository.findByUserId).not.toHaveBeenCalled();
		});

		it('should return failure when userId is null or undefined', async () => {
			const userId = null as any;

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(false);

			const error = result.error();
			expect(error).toBeInstanceOf(ValidationError);

			expect(mockGitProviderRepository.findByUserId).not.toHaveBeenCalled();
		});

		it('should return failure when repository throws an error', async () => {
			const userId = 'user-789';
			const repositoryError = new Error('Database connection failed');
			mockGitProviderRepository.findByUserId.mockRejectedValue(repositoryError);

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(false);

			const error = result.error();
			expect(error).toBeInstanceOf(CheckGitProviderConnectionError);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should handle different git providers correctly', async () => {
			const userId = 'user-gitlab-123';
			const gitlabConnection = GitProviderAuth.create({
				userId: userId,
				provider: 'gitlab',
				accessToken: GitProviderAccessToken.create({
					value: 'gitlab_access_token_456',
					isEncrypted: true
				})
			});

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitlabConnection);

			const result = await useCase.execute({ userId });

			expect(result.isSuccess).toBe(true);

			const { isConnected } = result.getValue();
			expect(isConnected).toBe(true);
		});
	});
});
