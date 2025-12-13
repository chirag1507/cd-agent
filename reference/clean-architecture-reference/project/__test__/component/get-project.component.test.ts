import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { GetProjectUseCase } from '../../application/use-cases/get-project/get-project.use-case';
import { Project } from '../../domain/entities/project.entity';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectRequest } from '../../application/use-cases/get-project/get-project.types';
import { getProjectExtractor } from '../../application/use-cases/get-project/get-project-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';

describe('Get Project Component Tests', () => {
	let mockProjectRepository: ProjectRepository;
	let mockGetProjectUseCase: GetProjectUseCase;
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
	const mockUseCaseFactory= {
		create: jest.fn()
	}
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

		mockGetProjectUseCase = new GetProjectUseCase(mockProjectRepository);

		const authenticatedGetProjectDecorator = new AuthenticateDecorator<
			GetProjectRequest,
			Project[]
		>(sessionManager, mockGetProjectUseCase, getProjectExtractor);

		mockGetProjectUseCaseFactory.create.mockReturnValue(authenticatedGetProjectDecorator);

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
			updateProjectStatusUseCaseFactory:mockUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory:mockUseCaseFactory
		});

		testApp = appInstance.getApp();
	});

	describe('GET /api/project', () => {
		it('should return 200 with projects when projects exist', async () => {
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

			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue(mockProjects);

			const response = await request(testApp)
				.get(`/api/project`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('projects');
			expect(response.body.projects).toHaveLength(2);

			mockProjects.forEach((project, index) => {
				expect(response.body.projects[index]).toHaveProperty('id', project.id);
				expect(response.body.projects[index]).toHaveProperty('name', project.name);
				expect(response.body.projects[index]).toHaveProperty(
					'description',
					project.description
				);
				expect(response.body.projects[index]).toHaveProperty('repoName', project.repoName);
				expect(response.body.projects[index]).toHaveProperty('repoId', project.repoId);
				expect(response.body.projects[index]).toHaveProperty(
					'examinationStatus',
					project.examinationStatus
				);
			});
		});

		it('should return 200 with empty projects array when no projects exist', async () => {
			mockProjectRepository.findByUserId = jest.fn().mockResolvedValue([]);

			const response = await request(testApp)
				.get(`/api/project`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('projects');
			expect(response.body.projects).toHaveLength(0);
			expect(response.body.projects).toEqual([]);
		});

		describe('Validation Error Tests', () => {
			it('should return 401 Unauthorized when token is missing', async () => {
				const response = await request(testApp).get(`/api/project`).expect(401);

				expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
			});

			it('should return 401 Unauthorized when token has empty userId', async () => {
				const emptyUserToken = await sessionManager.createSession({
					userId: '',
					email: 'test@test.com',
					firstName: 'Test'
				});

				const response = await request(testApp)
					.get(`/api/project`)
					.set('Authorization', `Bearer ${emptyUserToken}`)
					.expect(401);

				expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
			});

			const validationTestCases = [
				{
					description: 'user ID is missing',
					AuthToken: () =>
						sessionManager.createSession({
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'UNAUTHORIZED',
					code: 401
				},
				{
					description: 'user ID is empty string',
					AuthToken: () =>
						sessionManager.createSession({
							userId: '',
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'UNAUTHORIZED',
					code: 401
				},
				{
					description: 'user ID is whitespace only',
					AuthToken: () =>
						sessionManager.createSession({
							userId: '   ',
							email: 'test@test.com',
							firstName: 'Test'
						}),
					expectedMessage: 'User ID is required',
					code: 400
				}
			];

			it.each(validationTestCases)(
				'should return 401 when $description',
				async ({ AuthToken, expectedMessage, code }) => {
					const AuthenticatedToken = (await AuthToken?.()) || token;
					const response = await request(testApp)
						.get(`/api/project`)
						.set('Authorization', `Bearer ${AuthenticatedToken}`)
						.expect(code);

					expect(response.body).toHaveProperty('message', expectedMessage);
				}
			);
		});

		it('should return 500 when repository findByUserId fails', async () => {
			mockProjectRepository.findByUserId = jest
				.fn()
				.mockRejectedValue(new Error('Database connection failed'));

			const response = await request(testApp)
				.get(`/api/project`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', 'Failed to retrieve projects');
		});

		it('should return 500 when an unexpected error occurs', async () => {
			mockGetProjectUseCaseFactory.create.mockImplementation(() => {
				throw new Error('Unexpected service error');
			});

			const response = await request(testApp)
				.get(`/api/project`)
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while retrieving projects'
			);
		});
	});
});
