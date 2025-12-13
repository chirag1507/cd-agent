import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { GitProviderRepository } from '../../domain/interfaces/repositories/git-provider.repository';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { ListRepositoriesUseCase } from '../../application/use-cases/list-repositories/list-repositories.use-case';
import { ProjectBuilder } from '../builders/project.builder';
import { GitProviderAuthBuilder } from '../builders/git-provider-auth.builder';
import { GitProviderUnavailableError } from '../../domain/errors/git-provider.error';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { ListRepositoriesRequest } from '../../application/use-cases/list-repositories/list-repositories.types';
import { listRepositoriesExtractor } from '../../application/use-cases/list-repositories/list-repositories-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';
import { GitProviderService } from '../../domain/interfaces/services/git-provider.service';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';

describe('List Repositories Component Tests', () => {
	let mockGitProviderRepository: GitProviderRepository;
	let mockProjectRepository: ProjectRepository;
	let mockGitProviderService: GitProviderService;
	let mockListRepositoriesUseCase: ListRepositoriesUseCase;
	let testApp: express.Application;
	let sessionManager: JwtSessionManager<any>;
	let token: string;

	const mockRegisterUserUseCaseFactory = {
		create: jest.fn()
	};

	const mockAuthenticateWithSocialProviderFactory = {
		create: jest.fn()
	};

	const mockGetUserByEmailFactory = {
		create: jest.fn()
	};

	const mockGetSocialProviderAuthUrlFactory = {
		create: jest.fn()
	};

	const mockDeleteUserFactory = {
		create: jest.fn()
	};

	const mockConnectGitProviderUseCaseFactory = {
		create: jest.fn()
	};

	const mockGetGitProviderAuthUrlFactory = {
		create: jest.fn()
	};

	const mockDeleteGitProviderUseCaseFactory = {
		create: jest.fn()
	};

	const mockCheckGitProviderConnectionFactory = {
		create: jest.fn()
	};

	const mockGetProjectUseCaseFactory = {
		create: jest.fn()
	};

	const mockListRepositoriesUseCaseFactory = {
		create: jest.fn()
	};

	const mockAddProjectUseCaseFactory = {
		create: jest.fn()
	};

	const mockDeleteProjectUseCaseFactory = {
		create: jest.fn()
	};

	const mockAdmitForMonitoringUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetProjectByIdUseCaseFactory = {
		create: jest.fn()
	};
	const mockGenerateInitialDiagnosisUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetCategoryHealthScoreUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetDiagnosticsStatsUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetViolationsUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetRulesByCategoryUseCaseFactory = {
		create: jest.fn()
	};
	const mockUseCaseFactory = {
		create: jest.fn()
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		sessionManager = new JwtSessionManager<any>();

		mockGitProviderRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			delete: jest.fn()
		};

		mockProjectRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			delete: jest.fn(),
			updateExaminationStatus: jest.fn(),
			findByIds: jest.fn(),
			getCommitHashByProjectId: jest.fn(),
			updateCommitHash: jest.fn(),
			isProjectUnderExamination: jest.fn()
		};

		mockGitProviderService = {
			getRepositories: jest.fn(),
			getRepositoryDetails: jest.fn()
		};

		mockListRepositoriesUseCase = new ListRepositoriesUseCase(
			mockGitProviderRepository,
			mockGitProviderService,
			mockProjectRepository
		);

		const authenticatedListRepositoriesDecorator = new AuthenticateDecorator<
			ListRepositoriesRequest,
			{ repositories: any[] }
		>(sessionManager, mockListRepositoriesUseCase, listRepositoriesExtractor);

		mockListRepositoriesUseCaseFactory.create.mockReturnValue(
			authenticatedListRepositoriesDecorator
		);

		token = await sessionManager.createSession({
			userId: 'user-123',
			email: 'test@test.com',
			firstName: 'Test'
		});

		const appInstance = new App({
			registerUserUseCaseFactory: mockRegisterUserUseCaseFactory,
			authenticateWithSocialProviderUseCaseFactory: mockAuthenticateWithSocialProviderFactory,
			getUserByEmailFactory: mockGetUserByEmailFactory,
			getSocialProviderAuthUrlFactory: mockGetSocialProviderAuthUrlFactory,
			deleteUserFactory: mockDeleteUserFactory,
			connectGitProviderUseCaseFactory: mockConnectGitProviderUseCaseFactory,
			getGitProviderAuthUrlFactory: mockGetGitProviderAuthUrlFactory,
			deleteGitProviderUseCaseFactory: mockDeleteGitProviderUseCaseFactory,
			checkGitProviderConnectionFactory: mockCheckGitProviderConnectionFactory,
			listRepositoriesUseCaseFactory: mockListRepositoriesUseCaseFactory,
			getProjectUseCaseFactory: mockGetProjectUseCaseFactory,
			getProjectByIdUseCaseFactory: mockGetProjectByIdUseCaseFactory,
			addProjectUseCaseFactory: mockAddProjectUseCaseFactory,
			deleteProjectUseCaseFactory: mockDeleteProjectUseCaseFactory,
			admitForExaminationUseCaseFactory: mockAdmitForMonitoringUseCaseFactory,
			generateInitialDiagnosisUseCaseFactory: mockGenerateInitialDiagnosisUseCaseFactory,
			getCategoryHealthScoreUseCaseFactory: mockGetCategoryHealthScoreUseCaseFactory,
			getDiagnosticsStatsUseCaseFactory: mockGetDiagnosticsStatsUseCaseFactory,
			getViolationsUseCaseFactory: mockGetViolationsUseCaseFactory,
			getRulesByCategoryUseCaseFactory: mockGetRulesByCategoryUseCaseFactory,
			getProjectByIdsUseCaseFactory: mockUseCaseFactory,
			updateProjectStatusUseCaseFactory: mockUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory: mockUseCaseFactory
		});

		testApp = appInstance.getApp();
	});

	describe('GET /api/git-provider/user-repositories', () => {
		it('should return 200 with repositories when git provider connection exists', async () => {
			const userId = 'user-123';
			const accessToken = 'github-access-token';

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.create();

			const mockRepositories = [
				{
					id: 1,
					name: 'test-repo-1',
					fullName: 'testuser/test-repo-1',
					isPrivate: false
				},
				{
					id: 2,
					name: 'test-repo-2',
					fullName: 'testuser/test-repo-2',
					isPrivate: true
				}
			];

			const existingProject = new ProjectBuilder()
				.withUserId(userId)
				.withRepoId(1)
				.withRepoName('test-repo-1')
				.withName('Existing Project')
				.build();

			mockGitProviderRepository.findByUserId = jest
				.fn()
				.mockResolvedValue(mockGitProviderAuth);
			mockGitProviderService.getRepositories = jest.fn().mockResolvedValue(mockRepositories);
			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([existingProject]);

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('repositories');
			expect(response.body.repositories).toHaveLength(2);

			mockRepositories.forEach((repository, index) => {
				expect(response.body.repositories[index]).toHaveProperty('id', repository.id);
				expect(response.body.repositories[index]).toHaveProperty('name', repository.name);
				expect(response.body.repositories[index]).toHaveProperty(
					'fullName',
					repository.fullName
				);
				expect(response.body.repositories[index]).toHaveProperty(
					'isPrivate',
					repository.isPrivate
				);
				expect(response.body.repositories[index]).toHaveProperty('hasProject', index === 0);
			});
		});

		it('should return 200 with empty repositories array when no repositories exist', async () => {
			const userId = 'user-123';
			const accessToken = 'github-access-token';

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.create();

			mockGitProviderRepository.findByUserId = jest
				.fn()
				.mockResolvedValue(mockGitProviderAuth);
			mockGitProviderService.getRepositories = jest.fn().mockResolvedValue([]);
			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([]);

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('repositories');
			expect(response.body.repositories).toHaveLength(0);
			expect(response.body.repositories).toEqual([]);
		});

		describe('Validation Error Tests', () => {
			const validationTestCases = [
				{
					description: 'user ID is missing',
					status: 401,
					AuthToken: () =>
						sessionManager.createSession({
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'UNAUTHORIZED'
				},
				{
					description: 'user ID is empty string',
					status: 401,
					AuthToken: () =>
						sessionManager.createSession({
							userId: '',
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'UNAUTHORIZED'
				},
				{
					description: 'user ID is whitespace only',
					status: 401,
					AuthToken: () =>
						sessionManager.createSession({
							userId: '   ',
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'UNAUTHORIZED'
				}
			];

			it.each(validationTestCases)(
				'should return 401 when $description',
				async ({ expectedMessage, AuthToken, status }) => {
					const response = await request(testApp)
						.get(`/api/git-provider/user-repositories`)
						.set('Authorization', `Bearer ${AuthToken?.() || token}`)
						.expect(status);

					expect(response.body).toHaveProperty('message', expectedMessage);
				}
			);
		});

		it('should return 404 when git provider connection is not found', async () => {
			mockGitProviderRepository.findByUserId = jest.fn().mockResolvedValue(null);

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty(
				'message',
				`No git provider connection found for user`
			);
		});

		it('should return 502 when git provider repository service fails', async () => {
			const userId = 'user-123';
			const accessToken = 'github-access-token';

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({ value: accessToken, isEncrypted: false })
				)
				.withGitProvider('GITHUB')
				.create();

			mockGitProviderRepository.findByUserId = jest
				.fn()
				.mockResolvedValue(mockGitProviderAuth);
			mockGitProviderService.getRepositories = jest
				.fn()
				.mockRejectedValue(
					new GitProviderUnavailableError('Failed to retrieve user repositories')
				);

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(502);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve user repositories');
		});

		it('should return 500 when git provider repository findByUserId fails', async () => {
			mockGitProviderRepository.findByUserId = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve user repositories');
		});

		it('should return 500 when project repository findByUserId fails', async () => {
			const userId = 'user-123';
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(userId)
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'github-access-token',
						isEncrypted: false
					})
				)
				.withGitProvider('GITHUB')
				.create();

			mockGitProviderRepository.findByUserId = jest
				.fn()
				.mockResolvedValue(mockGitProviderAuth);

			mockProjectRepository.findByUserId = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.get(`/api/git-provider/user-repositories`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve user repositories');
		});

		it('should return 500 when an unexpected error occurs', async () => {
			mockListRepositoriesUseCaseFactory.create.mockImplementation(() => {
				throw new Error('Unexpected service error');
			});

			const response = await request(testApp)
				.get('/api/git-provider/user-repositories')
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while listing repositories'
			);
		});
	});
});
