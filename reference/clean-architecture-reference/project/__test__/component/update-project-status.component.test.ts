import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { UpdateProjectStatusUseCase } from '../../application/use-cases/update-project-status/update-project-status.use-case';
import { Project, ExaminationStatus } from '../../domain/entities/project.entity';

describe('Update Project Status Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockUpdateProjectStatusUseCase: UpdateProjectStatusUseCase;
	let testApp: express.Application;
	const API_KEY = 'test-api-key';

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
		process.env.UPDATE_PROJECT_STATUS_CALLBACK_API_KEY = API_KEY;

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

		mockUpdateProjectStatusUseCase = new UpdateProjectStatusUseCase(mockProjectRepository);

		mockUpdateProjectStatusUseCaseFactory.create.mockReturnValue(
			mockUpdateProjectStatusUseCase
		);

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

	afterEach(() => {
		delete process.env.UPDATE_PROJECT_STATUS_CALLBACK_API_KEY;
	});

	describe('PUT /api/project/status/callback', () => {
		it('should update project status successfully', async () => {
			const mockProject = Project.create({
				userId: 'user-123',
				repoId: 456,
				repoName: 'test-repo-1',
				name: 'Test Project 1',
				description: 'First test project'
			});

			mockProjectRepository.findById = jest.fn().mockResolvedValue(mockProject);

			const updatedProject = Project.create({
				userId: 'user-123',
				repoId: 456,
				repoName: 'test-repo-1',
				name: 'Test Project 1',
				description: 'First test project'
			});
			// Manually set status for test purpose as it's readonly or managed
			(updatedProject as any).props.examinationStatus = ExaminationStatus.COMPLETED;

			mockProjectRepository.updateExaminationStatus = jest
				.fn()
				.mockResolvedValue(updatedProject);

			const payload = {
				projectId: mockProject.id,
				examinationStatus: ExaminationStatus.COMPLETED
			};

			const response = await request(testApp)
				.put(`/api/project/status/callback`)
				.set('x-api-key', API_KEY)
				.send({
					body: {
						payload
					}
				})
				.expect(200);

			expect(response.body).toHaveProperty('message', 'Project status updated successfully');
			expect(response.body).toHaveProperty('id', updatedProject.id);
		});

		it('should return 401 Unauthorized when API key is missing or invalid', async () => {
			const payload = {
				projectId: 'some-id',
				examinationStatus: ExaminationStatus.COMPLETED
			};

			const response = await request(testApp)
				.put(`/api/project/status/callback`)
				.set('x-api-key', 'invalid-key')
				.send({
					body: {
						payload
					}
				})
				.expect(401);

			expect(response.body).toHaveProperty(
				'message',
				'Authentication failed. The token provided is invalid or expired.'
			);
		});

		it('should return 409 Conflict when project not found', async () => {
			mockProjectRepository.findById = jest.fn().mockResolvedValue(null);

			const payload = {
				projectId: 'non-existent-id',
				examinationStatus: ExaminationStatus.COMPLETED
			};

			const response = await request(testApp)
				.put(`/api/project/status/callback`)
				.set('x-api-key', API_KEY)
				.send({
					body: {
						payload
					}
				})
				.expect(409);

			expect(response.body).toHaveProperty('message', 'Project not found');
		});

		it('should return 500 when unexpected error occurs', async () => {
			mockProjectRepository.findById = jest
				.fn()
				.mockRejectedValue(new Error('Database error'));

			const payload = {
				projectId: 'some-id',
				examinationStatus: ExaminationStatus.COMPLETED
			};

			const response = await request(testApp)
				.put(`/api/project/status/callback`)
				.set('x-api-key', API_KEY)
				.send({
					body: {
						payload
					}
				})
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while updating project status'
			);
		});
	});
});
