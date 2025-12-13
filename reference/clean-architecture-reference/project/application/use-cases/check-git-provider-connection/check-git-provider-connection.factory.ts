import { PrismaGitProviderRepository } from '../../../infrastructure/repositories/git-provider.repository';
import { CheckGitProviderConnectionUseCase } from './check-git-provider-connection.use-case';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import {
	CheckGitProviderConnectionRequest,
	CheckGitProviderConnectionResult
} from './check-git-provider-connection.types';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { checkGitProviderConnectionExtractor } from './check-git-provider-connection-extractor';

export class CheckGitProviderConnectionFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const gitProviderAuthRepository = new PrismaGitProviderRepository();

		const useCase = new CheckGitProviderConnectionUseCase(gitProviderAuthRepository);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			CheckGitProviderConnectionRequest,
			CheckGitProviderConnectionResult
		>(sessionManager, useCase, checkGitProviderConnectionExtractor);
		return authenticatedUserProviderDecorator;
	}
}
