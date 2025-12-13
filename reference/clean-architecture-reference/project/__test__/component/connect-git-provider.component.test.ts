import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { GitProviderRepository } from '../../domain/interfaces/repositories/git-provider.repository';
import { ConnectGitProviderUseCase } from '../../application/use-cases/connect-git-provider/connect-git-provider-use-case';
import { ConnectGitProviderRequestBuilder } from '../builders/connect-git-provider-request.builder';
import { GitProviderOAuthTokenResponseBuilder } from '../builders/git-provider-oauth-token-response.builder';
import { GitAuthenticationService } from '../../domain/interfaces/services/git-authentication.service';

describe('Connect Git Provider Component Tests', () => {
	let mockGitAuthService: GitAuthenticationService;
	let mockGitProviderRepository: GitProviderRepository;
	let mockConnectGitProviderUseCase: ConnectGitProviderUseCase;
	let testApp: express.Application;

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
	const mockGetProjectByIdsUseCaseFactory = {
		create: jest.fn()
	};
	const mockUseCaseFactory = {
		create: jest.fn()
	};
	beforeEach(() => {
		jest.clearAllMocks();

		mockGitAuthService = {
			authenticateCallback: jest.fn(),
			getAuthorizationUrl: jest.fn()
		};

		mockGitProviderRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			delete: jest.fn()
		};

		mockConnectGitProviderUseCase = new ConnectGitProviderUseCase(
			mockGitAuthService,
			mockGitProviderRepository
		);

		mockConnectGitProviderUseCaseFactory.create.mockReturnValue(mockConnectGitProviderUseCase);

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

	describe('GET /api/git-provider/oauth/callback', () => {
		it('should redirect to dashboard on successful git provider connection', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withCode('valid-github-code')
				.withUserId('user-123')
				.build();

			const mockAuthData = new GitProviderOAuthTokenResponseBuilder()
				.withAccessToken('github-access-token-123')
				.withProvider('GITHUB')
				.build();

			(mockGitAuthService.authenticateCallback as jest.Mock).mockResolvedValue(mockAuthData);
			(mockGitProviderRepository.save as jest.Mock).mockResolvedValue(undefined);

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ code: connectRequest.code, state: connectRequest.userId })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/add-project');
		});

		it('should redirect to dashboard with error when authentication fails due to invalid code', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withCode('invalid-github-code')
				.withUserId('user-456')
				.build();

			const mockAuthData = new GitProviderOAuthTokenResponseBuilder()
				.withAccessToken('')
				.withProvider('GITHUB')
				.build();

			(mockGitAuthService.authenticateCallback as jest.Mock).mockResolvedValue(mockAuthData);

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ code: connectRequest.code, state: connectRequest.userId })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});

		it('should redirect to dashboard with error when repository save fails', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withCode('valid-github-code')
				.withUserId('user-789')
				.build();

			const mockAuthData = new GitProviderOAuthTokenResponseBuilder()
				.withAccessToken('github-access-token-456')
				.withProvider('GITHUB')
				.build();

			const repositoryError = new Error('Database connection failed');

			(mockGitAuthService.authenticateCallback as jest.Mock).mockResolvedValue(mockAuthData);
			(mockGitProviderRepository.save as jest.Mock).mockRejectedValue(repositoryError);

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ code: connectRequest.code, state: connectRequest.userId })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});

		it('should redirect to dashboard with error when git provider service throws an error', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withCode('problematic-code')
				.withUserId('user-999')
				.build();

			const serviceError = new Error('GitHub service unavailable');

			(mockGitAuthService.authenticateCallback as jest.Mock).mockRejectedValue(serviceError);

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ code: connectRequest.code, state: connectRequest.userId })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});

		it('should redirect to dashboard with error when missing code parameter', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withUserId('user-123')
				.build();

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ state: connectRequest.userId })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});

		it('should redirect to dashboard with error when missing state parameter', async () => {
			const connectRequest = new ConnectGitProviderRequestBuilder()
				.withCode('valid-github-code')
				.build();

			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.query({ code: connectRequest.code })
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});

		it('should redirect to dashboard with error when both code and state parameters are missing', async () => {
			const response = await request(testApp)
				.get('/api/git-provider/oauth/callback')
				.expect(302);

			expect(response.headers.location).toContain('/onboarding/connect-git-provider');
		});
	});
});
