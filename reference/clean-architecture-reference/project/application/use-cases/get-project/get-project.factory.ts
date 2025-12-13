import { GetProjectUseCase } from './get-project.use-case';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectRequest } from './get-project.types';
import { Project } from '../../../domain/entities/project.entity';
import { getProjectExtractor } from './get-project-extractor';

export class GetProjectUseCaseFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const useCase = new GetProjectUseCase(projectRepository);
		return new AuthenticateDecorator<GetProjectRequest, Project[]>(
			sessionManager,
			useCase,
			getProjectExtractor
		);
	}
}
