import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { GetProjectByIdUseCase } from '../../application/use-cases/get-project-by-id/get-project-by-id.use-case';
import { Project } from '../../domain/entities/project.entity';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectByIdRequest } from '../../application/use-cases/get-project-by-id/get-project-by-id.types';
import { getProjectByIdExtractor } from '../../application/use-cases/get-project-by-id/get-project-by-id-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';

describe('Get Project By ID Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockGetProjectByIdUseCase: GetProjectByIdUseCase;
	let testApp: express.Application;
	let sessionManager: JwtSessionManager<any>;
	let token: string;

	const mockRegisterUserUseCaseFactory = { create: jest.fn() };
	const mockAuthenticateWithSocialProviderFactory = { create: jest.fn() };
	const mockGetUserByEmailFactory = { create: jest.fn() };
	const mockGetSocialProviderAuthUrlFactory = { create: jest.fn() };
	const mockDeleteUserFactory = { create: jest.fn() };
	const mockConnectGitProviderUseCaseFactory = { create: jest.fn() };
	const mockGetGitProviderAuthUrlFactory = { create: jest.fn() };
	const mockDeleteGitProviderUseCaseFactory = { create: jest.fn() };
	const mockCheckGitProviderConnectionFactory = { create: jest.fn() };
	const mockGetProjectUseCaseFactory = { create: jest.fn() };
	const mockListRepositoriesUseCaseFactory = { create: jest.fn() };
	const mockAddProjectUseCaseFactory = { create: jest.fn() };
	const mockDeleteProjectUseCaseFactory = { create: jest.fn() };
	const mockAdmitForMonitoringUseCaseFactory = { create: jest.fn() };
	const mockGetProjectByIdUseCaseFactory = { create: jest.fn() };
	const mockGenerateInitialDiagnosisUseCaseFactory = { create: jest.fn() };
	const mockGetCategoryHealthScoreUseCaseFactory = { create: jest.fn() };
	const mockGetDiagnosticsStatsUseCaseFactory = { create: jest.fn() };
	const mockGetViolationsUseCaseFactory = { create: jest.fn() };
	const mockGetRulesByCategoryUseCaseFactory = { create: jest.fn() };
	const mockUseCaseFactory = { create: jest.fn() };

	beforeEach(async () => {
		jest.clearAllMocks();
		sessionManager = new JwtSessionManager<any>();

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

		mockGetProjectByIdUseCase = new GetProjectByIdUseCase(mockProjectRepository);

		const authenticatedGetProjectByIdDecorator = new AuthenticateDecorator<
			GetProjectByIdRequest,
			Project
		>(sessionManager, mockGetProjectByIdUseCase, getProjectByIdExtractor);

		mockGetProjectByIdUseCaseFactory.create.mockReturnValue(
			authenticatedGetProjectByIdDecorator
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

	describe('GET /api/project/:id', () => {
		it('should return 200 with project when project exists', async () => {
			const mockProject = Project.create({
				userId: 'user-123',
				repoId: 456,
				repoName: 'test-repo-1',
				name: 'Test Project 1',
				description: 'First test project'
			});

			mockProjectRepository.findById = jest.fn().mockResolvedValue(mockProject);

			const response = await request(testApp)
				.get(`/api/project/${mockProject.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body.project).toHaveProperty('id', mockProject.id);
			expect(response.body.project).toHaveProperty('name', mockProject.name);
			expect(response.body.project).toHaveProperty('description', mockProject.description);
			expect(response.body.project).toHaveProperty('repoName', mockProject.repoName);
			expect(response.body.project).toHaveProperty('repoId', mockProject.repoId);
		});

		it('should return 404 when project does not exist', async () => {
			mockProjectRepository.findById = jest.fn().mockResolvedValue(null);

			const response = await request(testApp)
				.get(`/api/project/non-existent-id`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty('message', 'Project not found');
		});

		it('should return 401 Unauthorized when token is missing', async () => {
			const response = await request(testApp).get(`/api/project/some-id`).expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 500 when repository findById fails', async () => {
			mockProjectRepository.findById = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.get(`/api/project/some-id`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve projects');
		});
	});
});
