import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { AddProjectUseCase } from '../../application/use-cases/add-project/add-project.use-case';
import { AddProjectRequestBuilder } from '../builders/add-project-request.builder';
import { Project } from '../../domain/entities/project.entity';
import { ProjectBuilder } from '../builders/project.builder';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { AddProjectRequest } from '../../application/use-cases/add-project/add-project.types';
import { AddProjectResult } from '../../application/use-cases/add-project/add-project.types';
import { addProjectExtractor } from '../../application/use-cases/add-project/add-project-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';

describe('Add Project Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockAddProjectUseCase: AddProjectUseCase;
	let testApp: express.Application;
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
	const sessionManager = new JwtSessionManager<any>();
	const mockGetViolationsUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetRulesByCategoryUseCaseFactory = {
		create: jest.fn()
	};
	const mockGetProjectByIdsUseCaseFactory = {
		create: jest.fn()
	};
	const mockUseCaseFactory = {
		create: jest.fn()
	};

	beforeEach(async () => {
		jest.clearAllMocks();

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

		mockAddProjectUseCase = new AddProjectUseCase(mockProjectRepository);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			AddProjectRequest,
			AddProjectResult
		>(sessionManager, mockAddProjectUseCase, addProjectExtractor);

		mockAddProjectUseCaseFactory.create.mockReturnValue(authenticatedUserProviderDecorator);

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
			getProjectByIdsUseCaseFactory: mockGetProjectByIdsUseCaseFactory,
			updateProjectStatusUseCaseFactory: mockUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory: mockUseCaseFactory
		});

		testApp = appInstance.getApp();
	});

	describe('POST /api/project', () => {
		it('should return 201 when project is successfully added', async () => {
			const addProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo')
				.withName('Test Project')
				.withDescription('A test project description')
				.buildWithAllFields();

			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([]);
			mockProjectRepository.save = jest.fn().mockResolvedValue(undefined);

			const response = await request(testApp)
				.post('/api/project')
				.send(addProjectRequest)
				.set('Authorization', `Bearer ${token}`)
				.expect(201);

			expect(response.body).toHaveProperty('message', 'Project added successfully');
			expect(response.body).toHaveProperty('id');
		});

		describe('Validation Error Tests', () => {
			const validationTestCases = [
				{
					description: 'user ID is missing',
					requestBuilder: () =>
						new AddProjectRequestBuilder()
							.withRepoId(456)
							.withRepoName('test-repo')
							.withName('Test Project')
							.withDescription('A test project description')
							.build(),
					expectedMessage: 'UNAUTHORIZED',
					AuthToken: () =>
						sessionManager.createSession({
							email: 'test@test.com',
							firstName: 'Test'
						})
				},
				{
					description: 'user ID is empty string',
					requestBuilder: () =>
						new AddProjectRequestBuilder()
							.withUserId('')
							.withRepoId(456)
							.withRepoName('test-repo')
							.withName('Test Project')
							.withDescription('A test project description')
							.build(),
					expectedMessage: 'UNAUTHORIZED',
					AuthToken: () =>
						sessionManager.createSession({
							userId: '',
							email: 'test@test.com',
							firstName: 'Test'
						})
				},
				{
					description: 'repository ID is missing',
					requestBuilder: () =>
						new AddProjectRequestBuilder()
							.withUserId('user-123')
							.withRepoName('test-repo')
							.withName('Test Project')
							.withDescription('A test project description')
							.build(),
					expectedMessage: 'Repository ID is required'
				},
				{
					description: 'repository name is missing',
					requestBuilder: () =>
						new AddProjectRequestBuilder()
							.withUserId('user-123')
							.withRepoId(456)
							.withName('Test Project')
							.withDescription('A test project description')
							.build(),
					expectedMessage: 'Repository name is required'
				},
				{
					description: 'project name is missing',
					requestBuilder: () =>
						new AddProjectRequestBuilder()
							.withUserId('user-123')
							.withRepoId(456)
							.withRepoName('test-repo')
							.withDescription('A test project description')
							.build(),
					expectedMessage: 'Project name is required'
				}
			];

			it.each(validationTestCases)(
				'should return 400 or 401 when $description',
				async ({ requestBuilder, expectedMessage, AuthToken }) => {
					const addProjectRequest = requestBuilder();
					const AuthenticatedToken = AuthToken?.() || token;

					const response = await request(testApp)
						.post('/api/project')
						.send(addProjectRequest)
						.set('Authorization', `Bearer ${AuthenticatedToken}`);

					expect([400, 401]).toContain(response.status);
					expect(response.body).toHaveProperty('message', expectedMessage);
				}
			);
		});

		it('should return 409 when project with same repository already exists', async () => {
			const addProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo')
				.withName('Test Project 1')
				.withDescription('A test project description')
				.buildWithAllFields();

			const existingProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo1')
				.withName('Test Project 1')
				.withDescription('A test project description')
				.build();

			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([existingProject]);

			const response = await request(testApp)
				.post('/api/project')
				.send(addProjectRequest)
				.set('Authorization', `Bearer ${token}`)
				.expect(409);

			expect(response.body).toHaveProperty(
				'message',
				'Project with this repository already exists'
			);
		});

		it('should return 409 when project with same name already exists', async () => {
			const addProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo')
				.withName('Test Project')
				.withDescription('A test project description')
				.buildWithAllFields();

			const existingProject = Project.create({
				userId: 'user-123',
				repoId: 789,
				repoName: 'different-repo',
				name: 'Test Project',
				description: 'An existing project with same name'
			});

			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([existingProject]);

			const response = await request(testApp)
				.post('/api/project')
				.send(addProjectRequest)
				.set('Authorization', `Bearer ${token}`)
				.expect(409);

			expect(response.body).toHaveProperty(
				'message',
				'Project with this name already exists'
			);
		});

		it('should return 500 when repository save fails', async () => {
			const addProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo')
				.withName('Test Project')
				.withDescription('A test project description')
				.buildWithAllFields();

			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([]);
			mockProjectRepository.save = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.post('/api/project')
				.send(addProjectRequest)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while creating the project'
			);
		});

		it('should return 500 when an unexpected error occurs', async () => {
			const addProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repo')
				.withName('Test Project')
				.withDescription('A test project description')
				.buildWithAllFields();

			mockAddProjectUseCaseFactory.create.mockImplementation(() => {
				throw new Error('Unexpected service error');
			});

			const response = await request(testApp)
				.post('/api/project')
				.send(addProjectRequest)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while adding the project'
			);
		});
	});
});
