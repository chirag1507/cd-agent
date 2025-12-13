import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { DeleteGitProviderRequest, DeleteGitProviderResponse } from './delete-git-provider.types';
import {
	GitProviderDeletionError,
	GitProviderNotFoundError
} from '../../../domain/errors/delete-git-provider.error';

export class DeleteGitProviderUseCase
	implements UseCase<DeleteGitProviderRequest, DeleteGitProviderResponse>
{
	constructor(private readonly gitProviderAuthRepository: GitProviderRepository) {}

	async execute(request: DeleteGitProviderRequest): Promise<DeleteGitProviderResponse> {
		try {
			const gitProviderAuth = await this.gitProviderAuthRepository.findByUserId(
				request.userId
			);
			if (!gitProviderAuth) {
				return Result.fail(
					new GitProviderNotFoundError('Git provider connection not found')
				);
			}
			await this.gitProviderAuthRepository.delete(request.userId);

			return Result.ok({
				success: true
			});
		} catch {
			return Result.fail(
				new GitProviderDeletionError(
					`An unexpected error occurred during git provider deletion`
				)
			);
		}
	}
}
