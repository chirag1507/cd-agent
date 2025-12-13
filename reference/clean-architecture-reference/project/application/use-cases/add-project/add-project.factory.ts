import { AddProjectUseCase } from './add-project.use-case';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { AddProjectRequest, AddProjectResult } from './add-project.types';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { addProjectExtractor } from './add-project-extractor';
export class AddProjectUseCaseFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const useCase = new AddProjectUseCase(projectRepository);
		const authenticatedUserProviderDecorator = new AuthenticateDecorator<
			AddProjectRequest,
			AddProjectResult
		>(sessionManager, useCase, addProjectExtractor);
		return authenticatedUserProviderDecorator;
	}
}
