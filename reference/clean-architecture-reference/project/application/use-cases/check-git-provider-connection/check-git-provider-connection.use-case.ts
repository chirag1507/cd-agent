import { Result } from '../../../../shared/domain/result';
import { UseCase } from '../../../../shared/domain/use-case';
import {
	CheckGitProviderConnectionRequest,
	CheckGitProviderConnectionResponse
} from './check-git-provider-connection.types';
import { CheckGitProviderConnectionRequestValidator } from './check-git-provider-connection-request.validator';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { CheckGitProviderConnectionError } from '../../../domain/errors/git-provider.error';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';

export class CheckGitProviderConnectionUseCase
	implements UseCase<CheckGitProviderConnectionRequest, CheckGitProviderConnectionResponse>
{
	constructor(private readonly gitProviderAuthRepository: GitProviderRepository) {}
	async execute(
		request: CheckGitProviderConnectionRequest
	): Promise<CheckGitProviderConnectionResponse> {
		try {
			CheckGitProviderConnectionRequestValidator.validate(request);

			const gitProviderAuth = await this.gitProviderAuthRepository.findByUserId(
				request.userId
			);

			return Result.ok({
				isConnected: gitProviderAuth ? true : false
			});
		} catch (error) {
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}

			return Result.fail(new CheckGitProviderConnectionError());
		}
	}
}
