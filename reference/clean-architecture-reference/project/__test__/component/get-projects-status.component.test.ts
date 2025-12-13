import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { GetProjectByIdsUseCase } from '../../application/use-cases/get-project-by-ids/get-project-by-ids.use-case';
import { Project } from '../../domain/entities/project.entity';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectByIdsRequest } from '../../application/use-cases/get-project-by-ids/get-project-by-ids.types';
import { getProjectByIdsExtractor } from '../../application/use-cases/get-project-by-ids/get-project-by-ids-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';

describe('Get Projects Status Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockGetProjectByIdsUseCase: GetProjectByIdsUseCase;
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
	const mockGetProjectByIdsUseCaseFactory = { create: jest.fn() };
	const mockUpdateProjectStatusUseCaseFactory = { create: jest.fn() };
	const mockDeleteDiagnosisByProjectIdUseCaseFactory = { create: jest.fn() };

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

		mockGetProjectByIdsUseCase = new GetProjectByIdsUseCase(mockProjectRepository);

		const authenticatedGetProjectByIdsDecorator = new AuthenticateDecorator<
			GetProjectByIdsRequest,
			Project[]
		>(sessionManager, mockGetProjectByIdsUseCase, getProjectByIdsExtractor);

		mockGetProjectByIdsUseCaseFactory.create.mockReturnValue(
			authenticatedGetProjectByIdsDecorator
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
			getProjectByIdsUseCaseFactory: mockGetProjectByIdsUseCaseFactory,
			updateProjectStatusUseCaseFactory: mockUpdateProjectStatusUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory: mockDeleteDiagnosisByProjectIdUseCaseFactory
		});

		testApp = appInstance.getApp();
	});

	describe('GET /api/project/status', () => {
		it('should return 200 with projects status when projects exist', async () => {
			const mockProjects = [
				Project.create({
					userId: 'user-123',
					repoId: 456,
					repoName: 'test-repo-1',
					name: 'Test Project 1',
					description: 'First test project'
				}),
				Project.create({
					userId: 'user-123',
					repoId: 789,
					repoName: 'test-repo-2',
					name: 'Test Project 2',
					description: 'Second test project'
				})
			];

			mockProjectRepository.findByIds = jest.fn().mockResolvedValue(mockProjects);

			const projectIds = mockProjects.map((p) => p.id);
			const queryString = projectIds.map((id) => `projectIds[]=${id}`).join('&');

			const response = await request(testApp)
				.get(`/api/project/status?${queryString}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('projects');
			expect(response.body.projects).toHaveLength(2);

			mockProjects.forEach((project, index) => {
				expect(response.body.projects[index]).toHaveProperty('id', project.id);
				expect(response.body.projects[index]).toHaveProperty(
					'examinationStatus',
					project.examinationStatus
				);
			});
		});

		it('should return 200 with empty array when no projects found', async () => {
			mockProjectRepository.findByIds = jest.fn().mockResolvedValue([]);

			const response = await request(testApp)
				.get(`/api/project/status?projectIds[]=non-existent-id`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('projects');
			expect(response.body.projects).toHaveLength(0);
		});

		it('should return 401 Unauthorized when token is missing', async () => {
			const response = await request(testApp).get(`/api/project/status`).expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 500 when repository findByIds fails', async () => {
			mockProjectRepository.findByIds = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.get(`/api/project/status?projectIds[]=some-id`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve projects');
		});
	});
});
