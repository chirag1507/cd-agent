import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { GetGitProviderAuthUrlUseCase } from '../../application/use-cases/get-git-provider-auth-url/get-git-provider-auth-url.use-case';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import {
	GetGitProviderAuthUrlRequest,
	GetGitProviderAuthUrlResult
} from '../../application/use-cases/get-git-provider-auth-url/get-git-provider-auth-url.types';
import { getGitProviderAuthUrlExtractor } from '../../application/use-cases/get-git-provider-auth-url/get-git-provider-auth-url-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';
import { GitAuthenticationService } from '../../domain/interfaces/services/git-authentication.service';

describe('Git Provider Auth URL Component Tests', () => {
	let mockGitAuthService: GitAuthenticationService;
	let mockGetGitProviderAuthUrlUseCase: GetGitProviderAuthUrlUseCase;
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
		mockGitAuthService = {
			getAuthorizationUrl: jest.fn(),
			authenticateCallback: jest.fn()
		};

		mockGetGitProviderAuthUrlUseCase = new GetGitProviderAuthUrlUseCase(mockGitAuthService);

		const authenticatedGetGitProviderAuthUrlDecorator = new AuthenticateDecorator<
			GetGitProviderAuthUrlRequest,
			GetGitProviderAuthUrlResult
		>(sessionManager, mockGetGitProviderAuthUrlUseCase, getGitProviderAuthUrlExtractor);

		mockGetGitProviderAuthUrlFactory.create.mockReturnValue(
			authenticatedGetGitProviderAuthUrlDecorator
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

	describe('GET /api/git-provider/auth-url', () => {
		it('should return 200 with GitHub authorization URL containing userId in state parameter when valid user ID is provided', async () => {
			const expectedUrl = `https://github.com/login/oauth/authorize?client_id=test&scope=repo&redirect_uri=http://localhost:3000/callback&state=user-123`;

			mockGitAuthService.getAuthorizationUrl = jest.fn().mockReturnValue(expectedUrl);

			const response = await request(testApp)
				.get('/api/git-provider/auth-url')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('url', expectedUrl);

			const urlObj = new URL(response.body.url);
			expect(urlObj.searchParams.get('state')).toBe('user-123');
		});

		it('should return 401 Unauthorized when token is missing', async () => {
			const response = await request(testApp).get('/api/git-provider/auth-url').expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 401 Unauthorized when token has empty userId', async () => {
			const emptyUserToken = await sessionManager.createSession({
				userId: '',
				email: 'test@test.com',
				firstName: 'Test'
			});

			const response = await request(testApp)
				.get('/api/git-provider/auth-url')
				.set('Authorization', `Bearer ${emptyUserToken}`)
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 500 when an unexpected error occurs', async () => {
			const errorMessage = 'Unexpected server error';

			mockGetGitProviderAuthUrlFactory.create.mockImplementation(() => {
				throw new Error(errorMessage);
			});

			const response = await request(testApp)
				.get('/api/git-provider/auth-url')
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty('message', errorMessage);
		});
	});
});
