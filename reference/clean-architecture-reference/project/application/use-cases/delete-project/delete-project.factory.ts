import { DeleteProjectUseCase } from './delete-project.use-case';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { DeleteProjectRequest } from './delete-project.types';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { deleteProjectExtractor } from './delete-project-extractor';

export class DeleteProjectUseCaseFactory {
	create(): AuthenticateDecorator<DeleteProjectRequest, {success: true}> {
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const useCase = new DeleteProjectUseCase(projectRepository);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			DeleteProjectRequest,
			{success: true}
		>(sessionManager, useCase, deleteProjectExtractor);
		return authenticatedUserProviderDecorator;
	}
}
