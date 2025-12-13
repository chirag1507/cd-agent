import { GetProjectByIdUseCase } from './get-project-by-id.use-case';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectByIdRequest } from './get-project-by-id.types';
import { Project } from '../../../domain/entities/project.entity';
import { getProjectByIdExtractor } from './get-project-by-id-extractor';

export class GetProjectByIdUseCaseFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const useCase = new GetProjectByIdUseCase(projectRepository);
		return new AuthenticateDecorator<GetProjectByIdRequest, Project>(
			sessionManager,
			useCase,
			getProjectByIdExtractor
		);
	}
}
