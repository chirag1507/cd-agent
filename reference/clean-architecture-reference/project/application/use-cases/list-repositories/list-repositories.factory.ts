import { PrismaGitProviderRepository } from '../../../infrastructure/repositories/git-provider.repository';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { ListRepositoriesUseCase } from './list-repositories.use-case';
import { GitHubServiceStub } from '../../../external-system-stubs/github-services/github-repository.service.stub';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { ListRepositoriesRequest } from './list-repositories.types';
import { ListRepositoriesResult } from './list-repositories.types';
import { listRepositoriesExtractor } from './list-repositories-extractor';
import { GitHubService } from '../../../infrastructure/services/github.service';

export class ListRepositoriesUseCaseFactory {
	create() {
		const gitProviderRepository = new PrismaGitProviderRepository();
		const projectRepository = new PrismaProjectRepository();
		const sessionManager = new JwtSessionManager<SessionData>();
		let useCase: ListRepositoriesUseCase;
		if (process.env.NODE_ENV === 'uat') {
			const gitProviderRepositoryService = new GitHubServiceStub();
			useCase = new ListRepositoriesUseCase(
				gitProviderRepository,
				gitProviderRepositoryService,
				projectRepository
			);
		} else {
			const gitService = new GitHubService();
			useCase = new ListRepositoriesUseCase(
				gitProviderRepository,
				gitService,
				projectRepository
			);
		}
		return new AuthenticateDecorator<ListRepositoriesRequest, ListRepositoriesResult>(
			sessionManager,
			useCase,
			listRepositoriesExtractor
		);
	}
}
