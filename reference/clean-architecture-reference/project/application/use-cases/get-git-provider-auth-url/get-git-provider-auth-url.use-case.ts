import { Result } from '../../../../shared/domain/result';
import { UseCase } from '../../../../shared/domain/use-case';
import {
	GetGitProviderAuthUrlRequest,
	GetGitProviderAuthUrlResponse
} from './get-git-provider-auth-url.types';
import { GitProviderUrlGenerationError } from '../../../domain/errors/git-provider.error';
import { GitAuthenticationService } from '../../../domain/interfaces/services/git-authentication.service';

export class GetGitProviderAuthUrlUseCase
	implements UseCase<GetGitProviderAuthUrlRequest, GetGitProviderAuthUrlResponse>
{
	constructor(private gitAuthenticationService: GitAuthenticationService) {}

	async execute(request: GetGitProviderAuthUrlRequest): Promise<GetGitProviderAuthUrlResponse> {
		try {
			const url = this.gitAuthenticationService.getAuthorizationUrl(request.userId);

			return Result.ok({
				url
			});
		} catch {
			return Result.fail(
				new GitProviderUrlGenerationError(
					'Failed to generate git provider authorization URL'
				)
			);
		}
	}
}
