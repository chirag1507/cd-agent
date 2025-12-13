import { GitProviderAuth } from '../../../domain/entities/git-provider';
import {
	ConnectGitProviderRequest,
	ConnectGitProviderResponse
} from './connect-git-provider.types';
import { Result } from '../../../../shared/domain/result';
import { UseCase } from '../../../../shared/domain/use-case';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import {
	GitProviderAuthenticationError,
	GitProviderSavingError
} from '../../../domain/errors/git-provider.error';
import { GitAuthenticationService } from '../../../domain/interfaces/services/git-authentication.service';
import { GitProviderAccessToken } from '../../../../shared/domain/value-objects/git-provider-access-token';

export class ConnectGitProviderUseCase
	implements UseCase<ConnectGitProviderRequest, ConnectGitProviderResponse>
{
	constructor(
		private readonly gitAuthenticationService: GitAuthenticationService,
		private readonly gitProviderRepository: GitProviderRepository
	) {}

	async execute(request: ConnectGitProviderRequest): Promise<ConnectGitProviderResponse> {
		try {
			const authData = await this.gitAuthenticationService.authenticateCallback(request.code);

			if (!authData.accessToken) {
				return Result.fail(
					new GitProviderAuthenticationError(
						'Failed to retrieve access token or user information from Git provider'
					)
				);
			}

			const gitProviderAccessTokenResult = GitProviderAccessToken.create({
				value: authData.accessToken,
				isEncrypted: false
			});

			//Need to clarify Do we need to add unique provider constraint for user over here??
			const gitProviderAuth = GitProviderAuth.create({
				userId: request.userId,
				accessToken: gitProviderAccessTokenResult,
				provider: authData.provider
			});

			await this.gitProviderRepository.save(gitProviderAuth);

			return Result.ok({
				success: true,
				userId: request.userId,
				provider: authData.provider
			});
		} catch (error) {
			if (
				error instanceof GitProviderAuthenticationError ||
				error instanceof GitProviderSavingError
			) {
				return Result.fail(error);
			}
			return Result.fail(
				new GitProviderAuthenticationError(
					'An unexpected error occurred during Git provider connection'
				)
			);
		}
	}
}
