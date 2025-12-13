import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { ConnectGitProviderUseCase } from './connect-git-provider-use-case';
import { GitProviderAuthenticationError } from '../../../domain/errors/git-provider.error';
import { ConnectGitProviderRequestBuilder } from '../../../__test__/builders/connect-git-provider-request.builder';
import { GitProviderOAuthTokenResponseBuilder } from '../../../__test__/builders/git-provider-oauth-token-response.builder';
import { GitAuthenticationService } from '../../../domain/interfaces/services/git-authentication.service';

describe('ConnectGitProviderUseCase', () => {
	let useCase: ConnectGitProviderUseCase;
	let gitAuthenticationService: jest.Mocked<GitAuthenticationService>;
	let gitProviderAuthRepository: jest.Mocked<GitProviderRepository>;

	beforeEach(() => {
		gitAuthenticationService = {
			authenticateCallback: jest.fn(),
			getAuthorizationUrl: jest.fn()
		};

		gitProviderAuthRepository = {
			save: jest.fn(),
			delete: jest.fn(),
			findByUserId: jest.fn()
		};

		useCase = new ConnectGitProviderUseCase(
			gitAuthenticationService,
			gitProviderAuthRepository
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should connect git provider successfully for new user', async () => {
		const request = new ConnectGitProviderRequestBuilder()
			.withCode('test-code')
			.withUserId('test-user-id')
			.build();

		const authData = new GitProviderOAuthTokenResponseBuilder()
			.withAccessToken('test-access-token')
			.withProvider()
			.build();

		gitAuthenticationService.authenticateCallback.mockResolvedValue(authData);
		gitProviderAuthRepository.save.mockResolvedValue();

		const result = await useCase.execute(request);

		expect(result.isSuccess).toBe(true);
		expect(result.getValue()).toEqual({
			success: true,
			userId: 'test-user-id',
			provider: 'GITHUB'
		});

		expect(gitAuthenticationService.authenticateCallback).toHaveBeenCalledWith(request.code);
		expect(gitProviderAuthRepository.save).toHaveBeenCalled();
	});

	it('should return failure when authentication data is incomplete', async () => {
		const request = new ConnectGitProviderRequestBuilder().withCode('test-code').build();

		const authData = new GitProviderOAuthTokenResponseBuilder()
			.withAccessToken('') // Missing access token
			.withProvider()
			.build();

		gitAuthenticationService.authenticateCallback.mockResolvedValue(authData);

		const result = await useCase.execute(request);
		expect(result.isSuccess).toBe(false);

		const error = result.error();
		expect(error).toBeInstanceOf(GitProviderAuthenticationError);
		expect(error.code).toBe('GIT_PROVIDER_AUTHENTICATION_FAILED');
		expect(gitProviderAuthRepository.save).not.toHaveBeenCalled();
	});

	it('should return failure when saving to repository fails', async () => {
		const request = new ConnectGitProviderRequestBuilder().withCode('test-code').build();

		const authData = new GitProviderOAuthTokenResponseBuilder()
			.withAccessToken('test-access-token')
			.withProvider()
			.build();

		gitAuthenticationService.authenticateCallback.mockResolvedValue(authData);

		const error = new Error('Database error');
		gitProviderAuthRepository.save.mockRejectedValue(error);

		const result = await useCase.execute(request);
		expect(result.isSuccess).toBe(false);

		const resultError = result.error();
		expect(resultError).toBeInstanceOf(GitProviderAuthenticationError);
		expect(resultError.code).toBe('GIT_PROVIDER_AUTHENTICATION_FAILED');
	});
});
