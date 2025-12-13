import { GetGitProviderAuthUrlUseCase } from './get-git-provider-auth-url.use-case';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import {
	GetGitProviderAuthUrlRequest,
	GetGitProviderAuthUrlResult
} from './get-git-provider-auth-url.types';
import { getGitProviderAuthUrlExtractor } from './get-git-provider-auth-url-extractor';
import { GithubAuthenticationServiceStub } from '../../../external-system-stubs/github-authentication/github-authentication.service.stub';
import { GitHubAuthService } from '../../../infrastructure/services/github-authentication.service';
export class GetGitProviderAuthUrlFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		let useCase: GetGitProviderAuthUrlUseCase;
		if (process.env.NODE_ENV === 'uat') {
			const githubAuthenticationService = new GithubAuthenticationServiceStub();
			useCase = new GetGitProviderAuthUrlUseCase(githubAuthenticationService);
		} else {
			const gitAuthService = new GitHubAuthService();
			useCase = new GetGitProviderAuthUrlUseCase(gitAuthService);
		}
		return new AuthenticateDecorator<GetGitProviderAuthUrlRequest, GetGitProviderAuthUrlResult>(
			sessionManager,
			useCase,
			getGitProviderAuthUrlExtractor
		);
	}
}
