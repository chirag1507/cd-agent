import { AdmitForExaminationUseCase } from './admit-for-examination.use-case';
import { AuthenticateDecorator } from '../../../../shared/application/decorators/AuthenticateDecorator';
import {
	AdmitForExaminationRequest,
	AdmitForExaminationResult
} from './admit-for-examination.types';
import { JwtSessionManager } from '../../../../shared/infrastructure/services/jwt-session-manager.service';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { admitForExaminationExtractor } from './admit-for-examination.extractor';
import { PrismaProjectRepository } from '../../../infrastructure/repositories/project.repository';
import { EventBusService } from '../../../../shared/infrastructure/services/event-bus.service';
import { PrismaGitProviderRepository } from '../../../infrastructure/repositories/git-provider.repository';
import { DomainEventBus } from '../../../../shared/domain/events/domain-event-publisher.interface';
import { EventBusServiceStub } from '../../../../shared/external-system-stubs/event-bus/event-bus.service.stub';
import { EventTypes } from '../../../../shared/domain/events/types';
import { GitHubServiceStub } from '../../../external-system-stubs/github-services/github-repository.service.stub';
import { GitProviderService } from '../../../domain/interfaces/services/git-provider.service';
import { GitHubService } from '../../../infrastructure/services/github.service';

export class AdmitForExaminationUseCaseFactory {
	create() {
		const sessionManager = new JwtSessionManager<SessionData>();
		const projectRepository = new PrismaProjectRepository();
		const gitProviderRepository = new PrismaGitProviderRepository();
		let githubService:GitProviderService;
		let eventBus: DomainEventBus;
		let useCase: AdmitForExaminationUseCase;

		if (process.env.NODE_ENV === 'uat') {
			eventBus = new EventBusServiceStub();
			githubService = new GitHubServiceStub()
			useCase = new AdmitForExaminationUseCase(
				projectRepository,
				gitProviderRepository,
				githubService,
				eventBus
			);
		} else {
			const queueUrl = process.env.PROCESS_REPOSITORY_QUEUE_URL;
			if (!queueUrl) {
				throw new Error('PROCESS_REPOSITORY_QUEUE_URL environment variable is not set.');
			}
			const queueConfig = [
				{
					eventType: EventTypes.PROJECT_ADMITTED_FOR_EXAMINATION,
					queueUrl: queueUrl
				}
			];
			eventBus = new EventBusService(queueConfig);
			githubService = new GitHubService()
			useCase = new AdmitForExaminationUseCase(
				projectRepository,
				gitProviderRepository,
				githubService,
				eventBus
			);
		}

		const authenticatedDecorator = new AuthenticateDecorator<
			AdmitForExaminationRequest,
			AdmitForExaminationResult
		>(sessionManager, useCase, admitForExaminationExtractor);

		return authenticatedDecorator;
	}
}
