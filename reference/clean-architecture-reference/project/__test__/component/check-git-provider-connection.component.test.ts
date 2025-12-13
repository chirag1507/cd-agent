import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { GitProviderRepository } from '../../domain/interfaces/repositories/git-provider.repository';
import { CheckGitProviderConnectionUseCase } from '../../application/use-cases/check-git-provider-connection/check-git-provider-connection.use-case';
import { GitProviderAuthBuilder } from '../builders/git-provider-auth.builder';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import {
	CheckGitProviderConnectionRequest,
	CheckGitProviderConnectionResult
} from '../../application/use-cases/check-git-provider-connection/check-git-provider-connection.types';
import { checkGitProviderConnectionExtractor } from '../../application/use-cases/check-git-provider-connection/check-git-provider-connection-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';

describe('Check Git Provider Connection Component Tests', () => {
	let mockGitProviderRepository: GitProviderRepository;
	let mockCheckGitProviderConnectionUseCase: CheckGitProviderConnectionUseCase;
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

		mockCheckGitProviderConnectionUseCase = new CheckGitProviderConnectionUseCase(
			mockGitProviderRepository
		);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			CheckGitProviderConnectionRequest,
			CheckGitProviderConnectionResult
		>(
			sessionManager,
			mockCheckGitProviderConnectionUseCase,
			checkGitProviderConnectionExtractor
		);

		mockCheckGitProviderConnectionFactory.create.mockReturnValue(
			authenticatedUserProviderDecorator
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

	describe('GET /api/git-provider/check-connection', () => {
		it('should return 200 with isGitConnected: true when user has git provider connection', async () => {
			const testUserId = 'user-123';
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId(testUserId)
				.withGitProvider('GITHUB')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'test-access-token', isEncrypted: true })
				)
				.build();

			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(
				mockGitProviderAuth
			);

			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.query({ userId: testUserId })
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('isGitConnected', true);
		});

		it('should return 200 with isGitConnected: false when user has no git provider connection', async () => {
			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(null);

			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('isGitConnected', false);
		});

		it('should return 400 Bad Request when userId is missing', async () => {
			const token = await sessionManager.createSession({
				email: 'test@test.com',
				firstName: 'Test'
			});
			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.set('Authorization', `Bearer ${token}`)
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 400 Bad Request when userId is empty string', async () => {
			const token = await sessionManager.createSession({
				userId: '',
				email: 'test@test.com',
				firstName: 'Test'
			});
			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.set('Authorization', `Bearer ${token}`)
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 400 Bad Request when userId is whitespace only', async () => {
			const token = await sessionManager.createSession({
				userId: '   ',
				email: 'test@test.com',
				firstName: 'Test'
			});
			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.set('Authorization', `Bearer ${token}`)
				.expect(400);

			expect(response.body).toHaveProperty('message', 'User ID is required');
		});

		it('should return 500 Internal Server Error when repository throws an error', async () => {
			const repositoryError = new Error('Database connection failed');

			(mockGitProviderRepository.findByUserId as jest.Mock).mockRejectedValue(
				repositoryError
			);

			const response = await request(testApp)
				.get('/api/git-provider/check-connection')
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred while checking the git provider connection'
			);
		});
	});
});
