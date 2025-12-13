import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { DeleteProjectRequest, DeleteProjectResponse } from './delete-project.types';
import { DeleteProjectRequestValidator } from './delete-project-request-validator';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectNotFoundError, ProjectDeletionError } from '../../../domain/errors/project.error';

export class DeleteProjectUseCase implements UseCase<DeleteProjectRequest, DeleteProjectResponse> {
	constructor(private readonly projectRepository: ProjectRepository) {}

	async execute(request: DeleteProjectRequest): Promise<DeleteProjectResponse> {
		try {
			DeleteProjectRequestValidator.validate(request);

			const project = await this.projectRepository.findById(request.projectId);

			if (!project) {
				return Result.fail(new ProjectNotFoundError());
			}

			await this.projectRepository.delete(request.projectId);

			return Result.ok({ success: true });
		} catch (error) {
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}
			return Result.fail(new ProjectDeletionError());
		}
	}
}
