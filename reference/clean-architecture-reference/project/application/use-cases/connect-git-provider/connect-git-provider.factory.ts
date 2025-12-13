import { ConnectGitProviderUseCase } from './connect-git-provider-use-case';
import { PrismaGitProviderRepository } from '../../../infrastructure/repositories/git-provider.repository';
import { GithubAuthenticationServiceStub } from '../../../external-system-stubs/github-authentication/github-authentication.service.stub';
import { GitHubAuthService } from '../../../infrastructure/services/github-authentication.service';

export class ConnectGitProviderUseCaseFactory {
	create() {
		const gitProviderAuthRepository = new PrismaGitProviderRepository();

		if (process.env.NODE_ENV === 'uat') {
			const githubAuthenticationService = new GithubAuthenticationServiceStub();
			return new ConnectGitProviderUseCase(
				githubAuthenticationService,
				gitProviderAuthRepository
			);
		}

		const githubAuthService = new GitHubAuthService();
		return new ConnectGitProviderUseCase(githubAuthService, gitProviderAuthRepository);
	}
}
