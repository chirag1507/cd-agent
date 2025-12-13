import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { DeleteGitProviderUseCase } from './delete-git-provider-use-case';
import { DeleteGitProviderRequest } from './delete-git-provider.types';
import {
	GitProviderNotFoundError,
	GitProviderDeletionError
} from '../../../domain/errors/delete-git-provider.error';
import { GitProviderAuthBuilder } from '../../../__test__/builders/git-provider-auth.builder';

describe('DeleteGitProviderUseCase', () => {
	let useCase: DeleteGitProviderUseCase;
	let gitProviderAuthRepository: jest.Mocked<GitProviderRepository>;

	beforeEach(() => {
		gitProviderAuthRepository = {
			save: jest.fn(),
			delete: jest.fn(),
			findByUserId: jest.fn()
		};

		useCase = new DeleteGitProviderUseCase(gitProviderAuthRepository);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should delete git provider connection successfully', async () => {
		const request: DeleteGitProviderRequest = {
			userId: 'test-user-id'
		};
		const mockGitProviderAuth = new GitProviderAuthBuilder().build();
		gitProviderAuthRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
		gitProviderAuthRepository.delete.mockResolvedValue();

		const result = await useCase.execute(request);

		expect(result.isSuccess).toBe(true);
		expect(result.getValue()).toEqual({
			success: true
		});
		expect(gitProviderAuthRepository.findByUserId).toHaveBeenCalledWith(request.userId);
		expect(gitProviderAuthRepository.delete).toHaveBeenCalledWith(request.userId);
	});

	it('should return failure when git provider connection is not found', async () => {
		const request: DeleteGitProviderRequest = {
			userId: 'non-existent-user-id'
		};

		gitProviderAuthRepository.findByUserId.mockResolvedValue(null);

		const result = await useCase.execute(request);

		expect(result.isSuccess).toBe(false);

		const error = result.error();
		expect(error).toBeInstanceOf(GitProviderNotFoundError);
		expect(error.code).toBe('GIT_PROVIDER_NOT_FOUND');
		expect(gitProviderAuthRepository.findByUserId).toHaveBeenCalledWith(request.userId);
		expect(gitProviderAuthRepository.delete).not.toHaveBeenCalled();
	});

	it('should handle repository errors during findByUserId', async () => {
		const request: DeleteGitProviderRequest = {
			userId: 'test-user-id'
		};

		const error = new Error('Database error');
		gitProviderAuthRepository.findByUserId.mockRejectedValue(error);

		const result = await useCase.execute(request);

		expect(result.isSuccess).toBe(false);

		const resultError = result.error();
		expect(resultError).toBeInstanceOf(GitProviderDeletionError);
		expect(resultError.code).toBe('GIT_PROVIDER_DELETION_FAILED');
		expect(gitProviderAuthRepository.findByUserId).toHaveBeenCalledWith(request.userId);
		expect(gitProviderAuthRepository.delete).not.toHaveBeenCalled();
	});

	it('should handle repository errors during delete', async () => {
		const request: DeleteGitProviderRequest = {
			userId: 'test-user-id'
		};

		const mockGitProviderAuth = new GitProviderAuthBuilder().build();
		gitProviderAuthRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);

		const error = new Error('Database error');
		gitProviderAuthRepository.delete.mockRejectedValue(error);

		const result = await useCase.execute(request);

		expect(result.isSuccess).toBe(false);

		const resultError = result.error();
		expect(resultError).toBeInstanceOf(GitProviderDeletionError);
		expect(resultError.code).toBe('GIT_PROVIDER_DELETION_FAILED');

		expect(gitProviderAuthRepository.findByUserId).toHaveBeenCalledWith(request.userId);
		expect(gitProviderAuthRepository.delete).toHaveBeenCalledWith(request.userId);
	});
});
