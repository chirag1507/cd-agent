import { DeleteGitProviderUseCase } from './delete-git-provider-use-case';
import { PrismaGitProviderRepository } from '../../../infrastructure/repositories/git-provider.repository';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import {
	DeleteGitProviderRequest,
	DeleteGitProviderResponseData
} from './delete-git-provider.types';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { deleteGitProviderExtractor } from './delete-git-provider-extractor';

export class DeleteGitProviderUseCaseFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const gitProviderAuthRepository = new PrismaGitProviderRepository();
		const useCase = new DeleteGitProviderUseCase(gitProviderAuthRepository);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			DeleteGitProviderRequest,
			DeleteGitProviderResponseData
		>(sessionManager, useCase, deleteGitProviderExtractor);
		return authenticatedUserProviderDecorator;
	}
}
