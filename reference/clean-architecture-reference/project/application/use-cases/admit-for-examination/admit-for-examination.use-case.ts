import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { DomainEventBus } from '../../../../shared/domain/events/domain-event-publisher.interface';
import {
	ProjectNotFoundError,
	ProjectAlreadyUnderExaminationError,
	ProjectStatusUpdateError,
	UserExaminationLimitReachedError,
	ProjectAlreadyScannedError
} from '../../../domain/errors/project.error';
import {
	AdmitForExaminationRequest,
	AdmitForExaminationResponse
} from './admit-for-examination.types';
import { AdmitForExaminationRequestValidator } from './admit-for-examination-request.validator';
import { ExaminationStatus } from '../../../domain/entities/project.entity';
import { ProjectAdmittedForExaminationEvent } from '../../../domain/events/project-admitted-for-examination.event';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { GitProviderNotFoundError } from '../../../domain/errors/delete-git-provider.error';
import { GitProviderService } from '../../../domain/interfaces/services/git-provider.service';
import { GitRepositoryEmptyError } from '../../../domain/errors/git-provider.error';

export class AdmitForExaminationUseCase
	implements UseCase<AdmitForExaminationRequest, AdmitForExaminationResponse>
{
	constructor(
		private readonly projectRepository: ProjectRepository,
		private readonly gitProviderRepository: GitProviderRepository,
		private readonly gitProviderService: GitProviderService,
		private readonly eventBus: DomainEventBus
	) {}

	async execute(request: AdmitForExaminationRequest): Promise<AdmitForExaminationResponse> {
		try {
			AdmitForExaminationRequestValidator.validate(request);

			const project = await this.projectRepository.findById(request.projectId);
			if (!project) {
				return Result.fail(new ProjectNotFoundError('Project not found'));
			}

			if (project.examinationStatus === ExaminationStatus.IN_PROGRESS) {
				return Result.fail(new ProjectAlreadyUnderExaminationError());
			}

			const hasProjectsUnderExamination =
				await this.projectRepository.isProjectUnderExamination(request.userId);

			if (hasProjectsUnderExamination) {
				return Result.fail(new UserExaminationLimitReachedError());
			}
			const gitProviderAuth = await this.gitProviderRepository.findByUserId(project.userId);
			if (!gitProviderAuth) {
				return Result.fail(new GitProviderNotFoundError());
			}

			const { repoFullName, repoBranch, repoCommitHash } =
				await this.gitProviderService.getRepositoryDetails(
					project,
					gitProviderAuth.accessToken
				);

			const lastCommit = await this.projectRepository.getCommitHashByProjectId(
				request.projectId
			);

			if (
				project.examinationStatus === ExaminationStatus.COMPLETED &&
				lastCommit === repoCommitHash
			) {
				return Result.fail(new ProjectAlreadyScannedError());
			}

			await this.projectRepository.updateCommitHash(request.projectId, repoCommitHash);

			const event = new ProjectAdmittedForExaminationEvent({
				accessToken: gitProviderAuth.accessToken.getEncryptedValue(),
				admittedBy: request.userId,
				newStatus: ExaminationStatus.IN_PROGRESS,
				previousStatus: project.examinationStatus,
				projectId: project.id,
				repoBranchName: repoBranch,
				repoCommitHash: repoCommitHash,
				repoFullName: repoFullName,
				repoId: project.repoId.toString(),
				userId: request.userId
			});

			const updatedProject = await this.projectRepository.updateExaminationStatus(
				request.projectId,
				ExaminationStatus.IN_PROGRESS
			);

			await this.eventBus.publish(event);

			return Result.ok({
				project: updatedProject
			});
		} catch (error) {
			console.log('Failed to admit project for examination', error);
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}
			if (error instanceof GitRepositoryEmptyError) {
				return Result.fail(error);
			}
			return Result.fail(
				new ProjectStatusUpdateError('Failed to admit project for examination')
			);
		}
	}
}
