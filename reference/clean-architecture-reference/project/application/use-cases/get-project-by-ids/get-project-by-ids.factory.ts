import { GetProjectByIdsUseCase } from './get-project-by-ids.use-case';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import { GetProjectByIdsRequest } from './get-project-by-ids.types';
import { Project } from '../../../domain/entities/project.entity';
import { getProjectByIdsExtractor } from './get-project-by-ids-extractor';

export class GetProjectByIdsUseCaseFactory {
	create() {
		console.log("Creating GetProjectByIdsUseCase instance");
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const useCase = new GetProjectByIdsUseCase(projectRepository);
		return new AuthenticateDecorator<GetProjectByIdsRequest, Project[]>(
			sessionManager,
			useCase,
			getProjectByIdsExtractor
		);
	}
}
