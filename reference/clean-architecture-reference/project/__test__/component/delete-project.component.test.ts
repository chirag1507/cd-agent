import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project/delete-project.use-case';
import { Project } from '../../domain/entities/project.entity';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { DeleteProjectRequest } from '../../application/use-cases/delete-project/delete-project.types';
import { deleteProjectExtractor } from '../../application/use-cases/delete-project/delete-project-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';

describe('Delete Project Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockDeleteProjectUseCase: DeleteProjectUseCase;
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

		mockDeleteProjectUseCase = new DeleteProjectUseCase(mockProjectRepository);

		const authenticatedDeleteProjectDecorator = new AuthenticateDecorator<
			DeleteProjectRequest,
			{ success: true }
		>(sessionManager, mockDeleteProjectUseCase, deleteProjectExtractor);

		mockDeleteProjectUseCaseFactory.create.mockReturnValue(authenticatedDeleteProjectDecorator);

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

	describe('DELETE /api/project/:id', () => {
		it('should return 200 when project is successfully deleted', async () => {
			const projectId = 'project-123';

			const existingProject = Project.create({
				userId: 'user-123',
				repoId: 456,
				repoName: 'test-repo',
				name: 'Test Project',
				description: 'A test project description'
			});

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockProjectRepository.delete = jest.fn().mockResolvedValue(undefined);

			const response = await request(testApp)
				.delete(`/api/project/${projectId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('message', 'Project deleted successfully');
		});
		describe('Validation Error Tests', () => {
			it('should return 401 Unauthorized when token is missing', async () => {
				const projectId = 'project-123';

				const response = await request(testApp)
					.delete(`/api/project/${projectId}`)
					.expect(401);

				expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
			});

			it('should return 401 Unauthorized when token has empty userId', async () => {
				const emptyUserToken = await sessionManager.createSession({
					userId: '',
					email: 'test@test.com',
					firstName: 'Test'
				});

				const projectId = 'project-123';

				const response = await request(testApp)
					.delete(`/api/project/${projectId}`)
					.set('Authorization', `Bearer ${emptyUserToken}`)
					.expect(401);

				expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
			});

			it('should return 404 when project ID is empty string (handled by Express routing)', async () => {
				const response = await request(testApp)
					.delete('/api/project/')
					.set('Authorization', `Bearer ${token}`)
					.expect(404);

				expect(response.body).toEqual({});
			});

			it('should return 400 when project ID is whitespace only', async () => {
				const projectId = encodeURIComponent('   ');

				const response = await request(testApp)
					.delete(`/api/project/${projectId}`)
					.set('Authorization', `Bearer ${token}`)
					.expect(400);

				expect(response.body).toHaveProperty('message', 'Project ID is required');
			});
		});

		it('should return 404 when project does not exist', async () => {
			const projectId = 'non-existent-project';

			mockProjectRepository.findById = jest.fn().mockResolvedValue(null);

			const response = await request(testApp)
				.delete(`/api/project/${projectId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty('message', 'Project not found');
		});

		it('should return 500 when repository delete fails', async () => {
			const projectId = 'project-123';

			const existingProject = Project.create({
				userId: 'user-123',
				repoId: 456,
				repoName: 'test-repo',
				name: 'Test Project',
				description: 'A test project description'
			});

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockProjectRepository.delete = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.delete(`/api/project/${projectId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to delete project');
		});

		it('should return 500 when repository findById fails', async () => {
			const projectId = 'project-123';

			mockProjectRepository.findById = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.delete(`/api/project/${projectId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to delete project');
		});

		it('should return 500 when an unexpected error occurs', async () => {
			const projectId = 'project-123';

			mockDeleteProjectUseCaseFactory.create.mockImplementation(() => {
				throw new Error('Unexpected service error');
			});

			const response = await request(testApp)
				.delete(`/api/project/${projectId}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while deleting the project'
			);
		});
	});
});
