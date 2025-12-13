import { ListRepositoriesUseCase } from './list-repositories.use-case';
import { ListRepositoriesRequest, Repository } from './list-repositories.types';
import { ListRepositoriesRequestBuilder } from '../../../__test__/builders/list-repositories-request.builder';
import { GitProviderAuthBuilder } from '../../../__test__/builders/git-provider-auth.builder';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import { GitProviderAccessToken } from '../../../../shared/domain/value-objects/git-provider-access-token';

describe('ListRepositoriesUseCase', () => {
	let useCase: ListRepositoriesUseCase;
	let mockGitProviderRepository: {
		findByUserId: jest.Mock;
		save: jest.Mock;
		delete: jest.Mock;
	};
	let mockGitProviderRepositoryService: {
		getRepositories: jest.Mock;
		getRepositoryDetails: jest.Mock;
	};
	let mockProjectRepository: {
		save: jest.Mock;
		findByUserId: jest.Mock;
		findById: jest.Mock;
		delete: jest.Mock;
		updateExaminationStatus: jest.Mock;
		findByIds: jest.Mock;
		getCommitHashByProjectId: jest.Mock;
		updateCommitHash: jest.Mock;
		isProjectUnderExamination: jest.Mock;
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockGitProviderRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			delete: jest.fn()
		};

		mockGitProviderRepositoryService = {
			getRepositories: jest.fn(),
			getRepositoryDetails: jest.fn()
		};

		mockProjectRepository = {
			save: jest.fn(),
			findByUserId: jest.fn(),
			findById: jest.fn(),
			delete: jest.fn(),
			updateExaminationStatus: jest.fn(),
			findByIds: jest.fn(),
			getCommitHashByProjectId: jest.fn(),
			updateCommitHash: jest.fn(),
			isProjectUnderExamination: jest.fn()
		};

		useCase = new ListRepositoriesUseCase(
			mockGitProviderRepository,
			mockGitProviderRepositoryService,
			mockProjectRepository
		);
	});

	describe('execute', () => {
		it('should successfully list repositories when user has valid git provider connection', async () => {
			const userId = 'user-123';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();
			const accessToken = 'github-token-456';
			const gitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.build();

			const repositoriesFromGitProvider = [
				{
					id: 1,
					name: 'my-awesome-project',
					fullName: 'user/my-awesome-project',
					isPrivate: false
				},
				{
					id: 2,
					name: 'private-repo',
					fullName: 'user/private-repo',
					isPrivate: true
				}
			];

			const expectedRepositories: Repository[] = [
				{
					id: 1,
					name: 'my-awesome-project',
					fullName: 'user/my-awesome-project',
					isPrivate: false,
					hasProject: false
				},
				{
					id: 2,
					name: 'private-repo',
					fullName: 'user/private-repo',
					isPrivate: true,
					hasProject: false
				}
			];

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitProviderAuth);
			mockGitProviderRepositoryService.getRepositories.mockResolvedValue(
				repositoriesFromGitProvider
			);
			mockProjectRepository.findByUserId.mockResolvedValue([]);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const response = result.getValue();
			expect(response.repositories).toEqual(expectedRepositories);
			expect(response.repositories).toHaveLength(2);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledTimes(1);

			expect(mockGitProviderRepositoryService.getRepositories).toHaveBeenCalledWith(
				accessToken
			);
			expect(mockGitProviderRepositoryService.getRepositories).toHaveBeenCalledTimes(1);
			expect(mockProjectRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockProjectRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should correctly set hasProject flag when user has existing projects', async () => {
			const userId = 'user-123';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();
			const accessToken = 'github-token-456';
			const gitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.build();

			const repositoriesFromGitProvider = [
				{
					id: 1,
					name: 'project-repo',
					fullName: 'user/project-repo',
					isPrivate: false
				},
				{
					id: 2,
					name: 'unused-repo',
					fullName: 'user/unused-repo',
					isPrivate: true
				},
				{
					id: 3,
					name: 'another-project-repo',
					fullName: 'user/another-project-repo',
					isPrivate: false
				}
			];

			const existingProjects = [
				new ProjectBuilder()
					.withUserId(userId)
					.withRepoId(1)
					.withRepoName('project-repo')
					.withName('My Project')
					.create(),
				new ProjectBuilder()
					.withUserId(userId)
					.withRepoId(3)
					.withRepoName('another-project-repo')
					.withName('Another Project')
					.create()
			];

			const expectedRepositories: Repository[] = [
				{
					id: 1,
					name: 'project-repo',
					fullName: 'user/project-repo',
					isPrivate: false,
					hasProject: true
				},
				{
					id: 2,
					name: 'unused-repo',
					fullName: 'user/unused-repo',
					isPrivate: true,
					hasProject: false
				},
				{
					id: 3,
					name: 'another-project-repo',
					fullName: 'user/another-project-repo',
					isPrivate: false,
					hasProject: true
				}
			];

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitProviderAuth);
			mockGitProviderRepositoryService.getRepositories.mockResolvedValue(
				repositoriesFromGitProvider
			);
			mockProjectRepository.findByUserId.mockResolvedValue(existingProjects);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const response = result.getValue();
			expect(response.repositories).toEqual(expectedRepositories);
			expect(response.repositories.filter((r) => r.hasProject)).toHaveLength(2);
			expect(response.repositories.filter((r) => !r.hasProject)).toHaveLength(1);

			expect(mockProjectRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockProjectRepository.findByUserId).toHaveBeenCalledTimes(1);
		});

		it('should return error when user has no connected git provider', async () => {
			const userId = 'user-without-provider';
			mockGitProviderRepository.findByUserId.mockResolvedValue(null);

			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(false);
			expect(result.error()).toBeDefined();

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledTimes(1);

			expect(mockGitProviderRepositoryService.getRepositories).not.toHaveBeenCalled();
		});

		it('should handle empty repository list', async () => {
			const userId = 'user-with-no-repos';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();

			const accessToken = 'github-token-789';
			const gitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.build();

			const emptyRepositories: Repository[] = [];

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitProviderAuth);
			mockGitProviderRepositoryService.getRepositories.mockResolvedValue(emptyRepositories);
			mockProjectRepository.findByUserId.mockResolvedValue([]);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const response = result.getValue();
			expect(response.repositories).toEqual([]);
			expect(response.repositories).toHaveLength(0);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepositoryService.getRepositories).toHaveBeenCalledWith(
				accessToken
			);
		});

		it('should handle git provider service error', async () => {
			const userId = 'user-service-error';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();
			const accessToken = 'github-token-error';
			const gitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.build();

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitProviderAuth);
			mockGitProviderRepositoryService.getRepositories.mockRejectedValue(
				new Error('Git provider service unavailable')
			);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(false);
			expect(result.error()).toBeDefined();

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepositoryService.getRepositories).toHaveBeenCalledWith(
				accessToken
			);
		});

		it('should handle repository database error', async () => {
			const userId = 'user-db-error';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();
			mockGitProviderRepository.findByUserId.mockRejectedValue(
				new Error('Database connection failed')
			);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(false);
			expect(result.error()).toBeDefined();

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepositoryService.getRepositories).not.toHaveBeenCalled();
		});

		it('should successfully list single repository', async () => {
			const userId = 'user-single-repo';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(userId)
				.build();
			const accessToken = 'github-token-single';
			const gitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.build();

			const repositoriesFromGitProvider = [
				{
					id: 1,
					name: 'solo-project',
					fullName: 'user/solo-project',
					isPrivate: true
				}
			];

			const expectedRepositories: Repository[] = [
				{
					id: 1,
					name: 'solo-project',
					fullName: 'user/solo-project',
					isPrivate: true,
					hasProject: false
				}
			];

			mockGitProviderRepository.findByUserId.mockResolvedValue(gitProviderAuth);
			mockGitProviderRepositoryService.getRepositories.mockResolvedValue(
				repositoriesFromGitProvider
			);
			mockProjectRepository.findByUserId.mockResolvedValue([]);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const response = result.getValue();
			expect(response.repositories).toEqual(expectedRepositories);
			expect(response.repositories).toHaveLength(1);
			expect(response.repositories[0].name).toBe('solo-project');
			expect(response.repositories[0].isPrivate).toBe(true);
			expect(response.repositories[0].hasProject).toBe(false);

			expect(mockGitProviderRepository.findByUserId).toHaveBeenCalledWith(userId);
			expect(mockGitProviderRepositoryService.getRepositories).toHaveBeenCalledWith(
				accessToken
			);
		});

		it('should handle invalid user ID format', async () => {
			const invalidUserId = '';
			const request: ListRepositoriesRequest = new ListRepositoriesRequestBuilder()
				.withUserId(invalidUserId)
				.build();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(false);
			expect(result.error()).toBeDefined();

			expect(mockGitProviderRepository.findByUserId).not.toHaveBeenCalled();
			expect(mockGitProviderRepositoryService.getRepositories).not.toHaveBeenCalled();
		});
	});
});
