import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import {
	UpdateProjectStatusRequest,
	UpdateProjectStatusResponse
} from './update-project-status.types';
import { ProjectCreationError, ProjectNotFoundError } from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { UpdateProjectStatusRequestValidator } from './update-project-status-request-validator';

export class UpdateProjectStatusUseCase
	implements UseCase<UpdateProjectStatusRequest, UpdateProjectStatusResponse>
{
	constructor(private readonly projectRepository: ProjectRepository) {}

	async execute(request: UpdateProjectStatusRequest): Promise<UpdateProjectStatusResponse> {
		try {
			UpdateProjectStatusRequestValidator.validate(request);

			const project = await this.projectRepository.findById(request.projectId);

			if (!project) {
				return Result.fail(new ProjectNotFoundError());
			}

			const updatedProject = await this.projectRepository.updateExaminationStatus(
				request.projectId,
				request.examinationStatus
			);

			return Result.ok({ project: updatedProject });
		} catch (error: any) {
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}
			return Result.fail(
				new ProjectCreationError('An unexpected error occurred while creating the project')
			);
		}
	}
}
