import { GetGitProviderAuthUrlUseCase } from './get-git-provider-auth-url.use-case';
import { GitProviderUrlGenerationError } from '../../../domain/errors/git-provider.error';
import { GitAuthenticationService } from '../../../domain/interfaces/services/git-authentication.service';

describe('GetGitProviderAuthUrlUseCase', () => {
	let useCase: GetGitProviderAuthUrlUseCase;
	let mockGithubAuthenticationService: jest.Mocked<GitAuthenticationService>;

	beforeEach(() => {
		mockGithubAuthenticationService = {
			getAuthorizationUrl: jest.fn(),
			authenticateCallback: jest.fn()
		};
		useCase = new GetGitProviderAuthUrlUseCase(mockGithubAuthenticationService);
	});

	it('should return GitHub authorization URL when requested', async () => {
		const testUserId = 'user-123';
		const expectedUrl =
			'https://github.com/login/oauth/authorize?client_id=test&scope=repo&redirect_uri=http://localhost:3000/callback';
		mockGithubAuthenticationService.getAuthorizationUrl.mockReturnValue(expectedUrl);

		const result = await useCase.execute({ userId: testUserId });

		expect(result.isSuccess).toBe(true);
		expect(result.getValue().url).toBe(expectedUrl);
		expect(mockGithubAuthenticationService.getAuthorizationUrl).toHaveBeenCalledWith(
			testUserId
		);
		expect(mockGithubAuthenticationService.getAuthorizationUrl).toHaveBeenCalledTimes(1);
	});

	it('should return failure when service throws an exception', async () => {
		const testUserId = 'user-456';
		const errorMessage = 'GitHub service unavailable';
		mockGithubAuthenticationService.getAuthorizationUrl.mockImplementation(() => {
			throw new Error(errorMessage);
		});

		const result = await useCase.execute({ userId: testUserId });

		expect(result.isSuccess).toBe(false);

		const error = result.error();
		expect(error).toBeInstanceOf(GitProviderUrlGenerationError);
		expect(error.code).toBe('GIT_PROVIDER_URL_GENERATION_FAILED');
		expect(mockGithubAuthenticationService.getAuthorizationUrl).toHaveBeenCalledWith(
			testUserId
		);
	});
});
