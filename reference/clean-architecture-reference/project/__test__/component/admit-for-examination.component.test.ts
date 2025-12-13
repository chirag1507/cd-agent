import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { AdmitForExaminationUseCase } from '../../application/use-cases/admit-for-examination/admit-for-examination.use-case';
import { ProjectBuilder } from '../builders/project.builder';
import { GitProviderAuthBuilder } from '../builders/git-provider-auth.builder';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { AdmitForExaminationRequest } from '../../application/use-cases/admit-for-examination/admit-for-examination.types';
import { AdmitForExaminationResult } from '../../application/use-cases/admit-for-examination/admit-for-examination.types';
import { admitForExaminationExtractor } from '../../application/use-cases/admit-for-examination/admit-for-examination.extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';
import { ExaminationStatus } from '../../domain/entities/project.entity';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';
import { GitRepositoryEmptyError } from '../../domain/errors/git-provider.error';

describe('Admit For Examination Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockAdmitForExaminationUseCase: AdmitForExaminationUseCase;
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

	const mockAdmitForExaminationUseCaseFactory = {
		create: jest.fn()
	};

	const mockEventBus = {
		publish: jest.fn(),
		publishAll: jest.fn()
	};
	const mockGitProviderService = {
		getRepositories: jest.fn(),
		getRepositoryDetails: jest.fn()
	};
	const mockGitProviderRepository = {
		findByUserId: jest.fn(),
		save: jest.fn(),
		delete: jest.fn()
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
	const sessionManager = new JwtSessionManager<any>();

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

		mockGitProviderService.getRepositoryDetails.mockResolvedValue({
			repoFullName: 'user/repo',
			repoBranch: 'main',
			repoCommitHash: 'abc123def456'
		});

		(mockProjectRepository.getCommitHashByProjectId as jest.Mock).mockResolvedValue(
			'old-commit-hash'
		);

		(mockProjectRepository.updateCommitHash as jest.Mock).mockResolvedValue(undefined);

		mockGitProviderRepository.findByUserId.mockResolvedValue(
			new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'mock-access-token', isEncrypted: true })
				)
				.withGitProvider('GITHUB')
				.build()
		);
		mockEventBus.publish.mockResolvedValue(undefined);

		mockAdmitForExaminationUseCase = new AdmitForExaminationUseCase(
			mockProjectRepository,
			mockGitProviderRepository,
			mockGitProviderService,
			mockEventBus
		);

		const authenticatedAdmitForExaminationDecorator = new AuthenticateDecorator<
			AdmitForExaminationRequest,
			AdmitForExaminationResult
		>(sessionManager, mockAdmitForExaminationUseCase, admitForExaminationExtractor);

		mockAdmitForExaminationUseCaseFactory.create.mockReturnValue(
			authenticatedAdmitForExaminationDecorator
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
			admitForExaminationUseCaseFactory: mockAdmitForExaminationUseCaseFactory,
			generateInitialDiagnosisUseCaseFactory: mockGenerateInitialDiagnosisUseCaseFactory,
			getCategoryHealthScoreUseCaseFactory: mockGetCategoryHealthScoreUseCaseFactory,
			getDiagnosticsStatsUseCaseFactory: mockGetDiagnosticsStatsUseCaseFactory,
			getViolationsUseCaseFactory: mockGetViolationsUseCaseFactory,
			getRulesByCategoryUseCaseFactory: mockGetRulesByCategoryUseCaseFactory,
			getProjectByIdsUseCaseFactory: mockGetProjectByIdUseCaseFactory,
			updateProjectStatusUseCaseFactory: mockUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory: mockUseCaseFactory
		});

		testApp = appInstance.getApp();
	});

	describe('POST /api/project/:id/admit', () => {
		it('should return 200 when project is successfully admitted for examination', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const updatedProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockProjectRepository.updateExaminationStatus = jest
				.fn()
				.mockResolvedValue(updatedProject);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body.id).toBe(projectId);
			expect(response.body.status).toBe(ExaminationStatus.IN_PROGRESS);
		});

		it('should return 404 when project does not exist', async () => {
			const projectId = 'non-existent-project';

			mockProjectRepository.findById = jest.fn().mockResolvedValue(null);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty('message', 'Project not found');
		});

		it('should return 404 when git provider authentication is not found', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockGitProviderRepository.findByUserId.mockResolvedValue(null);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty('message');
		});

		it('should return 409 when project is already under examination', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(409);

			expect(response.body).toHaveProperty('message', 'Project is already under examination');
		});
		it('should return 422 when git repository is empty (no commits)', async () => {
			const projectId = 'project-456';

			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);

			mockGitProviderService.getRepositoryDetails.mockRejectedValue(
				new GitRepositoryEmptyError()
			);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(422);

			expect(response.body).toHaveProperty('message', 'Git repository is empty.');
		});

		it('should return 401 when no authorization token is provided', async () => {
			const projectId = 'project-456';

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 401 when invalid authorization token is provided', async () => {
			const projectId = 'project-456';

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', 'Bearer invalid-token')
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 400 when projectId is empty string', async () => {
			const response = await request(testApp)
				.post('/api/project/   /admit')
				.send({})
				.set('Authorization', `Bearer ${token}`)
				.expect(400);

			expect(response.body).toHaveProperty('message', 'Project ID is required');
		});

		it('should return 500 when repository findById fails', async () => {
			const projectId = 'project-456';

			mockProjectRepository.findById = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'Failed to admit project for examination'
			);
		});

		it('should return 500 when git provider repository fails', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockGitProviderRepository.findByUserId.mockRejectedValue(
				new Error('Git provider service unavailable')
			);

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'Failed to admit project for examination'
			);
		});

		it('should return 500 when event bus publish fails', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockEventBus.publish.mockRejectedValue(new Error('Event bus connection failed'));

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'Failed to admit project for examination'
			);
		});

		it('should return 500 when repository updateExaminationStatus fails', async () => {
			const projectId = 'project-456';
			const existingProject = new ProjectBuilder()
				.withId(projectId)
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			mockProjectRepository.findById = jest.fn().mockResolvedValue(existingProject);
			mockProjectRepository.updateExaminationStatus = jest
				.fn()
				.mockRejectedValue(new Error('Database update failed'));

			const response = await request(testApp)
				.post(`/api/project/${projectId}/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'Failed to admit project for examination'
			);
		});

		it('should return 500 when an unexpected error occurs', async () => {
			mockAdmitForExaminationUseCaseFactory.create.mockImplementation(() => {
				throw new Error('Unexpected service error');
			});

			const response = await request(testApp)
				.post(`/api/project/123/admit`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while admitting project for examination'
			);
		});
	});
});
