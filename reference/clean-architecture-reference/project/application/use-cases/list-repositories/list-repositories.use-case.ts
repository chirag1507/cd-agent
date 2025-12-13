import { Result } from '../../../../shared/domain/result';
import { UseCase } from '../../../../shared/domain/use-case';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { ListRepositoriesRequest, ListRepositoriesResponse } from './list-repositories.types';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import {
	GitProviderConnectionNotFoundError,
	GitProviderUnavailableError,
	ListRepositoriesError
} from '../../../domain/errors/git-provider.error';
import { ListRepositoriesRequestValidator } from './list-repositories-request.validator';
import { GitProviderService } from '../../../domain/interfaces/services/git-provider.service';

export class ListRepositoriesUseCase
	implements UseCase<ListRepositoriesRequest, ListRepositoriesResponse>
{
	constructor(
		private readonly gitProviderRepository: GitProviderRepository,
		private readonly gitProviderService: GitProviderService,
		private readonly projectRepository: ProjectRepository
	) {}

	async execute(request: ListRepositoriesRequest): Promise<ListRepositoriesResponse> {
		try {
			ListRepositoriesRequestValidator.validate(request);

			const gitProviderAuth = await this.gitProviderRepository.findByUserId(request.userId);

			if (!gitProviderAuth) {
				return Result.fail(new GitProviderConnectionNotFoundError());
			}

			const repositories = await this.gitProviderService.getRepositories(
				gitProviderAuth.accessToken.getDecryptedValue()
			);

			const existingProjects = await this.projectRepository.findByUserId(request.userId);

			const enhancedRepositories = repositories.map((repo) => ({
				...repo,
				hasProject: existingProjects.some((project) => project.repoId === repo.id)
			}));

			return Result.ok({
				repositories: enhancedRepositories
			});
		} catch (error) {
			console.log(error);
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}

			if (error instanceof GitProviderUnavailableError) {
				return Result.fail(error);
			}

			return Result.fail(new ListRepositoriesError('Failed to retrieve user repositories'));
		}
	}
}
