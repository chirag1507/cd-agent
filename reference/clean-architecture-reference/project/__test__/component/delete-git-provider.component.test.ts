import request from 'supertest';
import express from 'express';
import { App } from '../../../shared/presentation/http/app';
import { GitProviderRepository } from '../../domain/interfaces/repositories/git-provider.repository';
import { DeleteGitProviderUseCase } from '../../application/use-cases/delete-git-provider/delete-git-provider-use-case';
import { GitProviderAuthBuilder } from '../builders/git-provider-auth.builder';
import { AuthenticateDecorator } from '../../../shared/application/decorators/AuthenticateDecorator';
import {
	DeleteGitProviderRequest,
	DeleteGitProviderResponseData
} from '../../application/use-cases/delete-git-provider/delete-git-provider.types';
import { deleteGitProviderExtractor } from '../../application/use-cases/delete-git-provider/delete-git-provider-extractor';
import { JwtSessionManager } from '../../../shared/infrastructure/services/jwt-session-manager.service';
import { GitProviderAccessToken } from '../../../shared/domain/value-objects/git-provider-access-token';

describe('Delete Git Provider Component Tests', () => {
	let mockGitProviderRepository: GitProviderRepository;
	let mockDeleteGitProviderUseCase: DeleteGitProviderUseCase;
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

	const mockAddProjectUseCaseFactory = {
		create: jest.fn()
	};

	const mockListRepositoriesUseCaseFactory = {
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

		mockGitProviderRepository = {
			findByUserId: jest.fn(),
			save: jest.fn(),
			delete: jest.fn()
		};

		mockDeleteGitProviderUseCase = new DeleteGitProviderUseCase(mockGitProviderRepository);

		const authenticatedDeleteGitProviderDecorator = new AuthenticateDecorator<
			DeleteGitProviderRequest,
			DeleteGitProviderResponseData
		>(sessionManager, mockDeleteGitProviderUseCase, deleteGitProviderExtractor);

		mockDeleteGitProviderUseCaseFactory.create.mockReturnValue(
			authenticatedDeleteGitProviderDecorator
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
			updateProjectStatusUseCaseFactory:mockUseCaseFactory,
			deleteDiagnosisByProjectIdUseCaseFactory:mockUseCaseFactory

		});

		testApp = appInstance.getApp();
	});

	describe('DELETE /api/git-provider', () => {
		it('should return 200 and success message when git provider is successfully deleted', async () => {
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withGitProvider('GITHUB')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'test-access-token', isEncrypted: true })
				)
				.build();

			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(
				mockGitProviderAuth
			);
			(mockGitProviderRepository.delete as jest.Mock).mockResolvedValue(undefined);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});

		it('should return 401 Unauthorized when token is missing', async () => {
			const response = await request(testApp).delete('/api/git-provider').expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 401 Unauthorized when token has empty userId', async () => {
			const emptyUserToken = await sessionManager.createSession({
				userId: '',
				email: 'test@test.com',
				firstName: 'Test'
			});

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${emptyUserToken}`)
				.expect(401);

			expect(response.body).toHaveProperty('message', 'UNAUTHORIZED');
		});

		it('should return 404 Not Found when git provider connection does not exist', async () => {
			// We're using the token with userId 'user-123'
			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(null);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(response.body).toHaveProperty('message', 'Git provider connection not found');
		});

		it('should return 500 Internal Server Error when repository findByUserId throws an error', async () => {
			const repositoryError = new Error('Database connection failed');

			(mockGitProviderRepository.findByUserId as jest.Mock).mockRejectedValue(
				repositoryError
			);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred during git provider deletion'
			);
		});

		it('should return 500 Internal Server Error when repository delete throws an error', async () => {
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withGitProvider('GITHUB')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'test-access-token', isEncrypted: true })
				)
				.build();

			const repositoryError = new Error('Database connection failed');

			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(
				mockGitProviderAuth
			);
			(mockGitProviderRepository.delete as jest.Mock).mockRejectedValue(repositoryError);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(500);

			expect(response.body).toHaveProperty(
				'message',
				'An unexpected error occurred during git provider deletion'
			);
		});

		it('should handle different git providers (GITLAB)', async () => {
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-gitlab')
				.withGitProvider('GITLAB')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'gitlab-access-token',
						isEncrypted: true
					})
				)
				.build();

			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(
				mockGitProviderAuth
			);
			(mockGitProviderRepository.delete as jest.Mock).mockResolvedValue(undefined);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});

		it('should handle different git providers (BITBUCKET)', async () => {
			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-bitbucket')
				.withGitProvider('BITBUCKET')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'bitbucket-access-token',
						isEncrypted: true
					})
				)
				.build();

			(mockGitProviderRepository.findByUserId as jest.Mock).mockResolvedValue(
				mockGitProviderAuth
			);
			(mockGitProviderRepository.delete as jest.Mock).mockResolvedValue(undefined);

			const response = await request(testApp)
				.delete('/api/git-provider')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(response.body).toHaveProperty('success', true);
		});
	});
});
