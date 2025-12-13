import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { GetProjectByIdRequest, GetProjectByIdResponse } from './get-project-by-id.types';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError, ProjectNotFoundError } from '../../../domain/errors/project.error';
import { GetProjectByIdRequestValidator } from './get-project-by-id-request-validator';

export class GetProjectByIdUseCase
	implements UseCase<GetProjectByIdRequest, GetProjectByIdResponse>
{
	constructor(private readonly projectRepository: ProjectRepository) {}

	async execute(request: GetProjectByIdRequest): Promise<GetProjectByIdResponse> {
		try {
			GetProjectByIdRequestValidator.validate(request);

			const project = await this.projectRepository.findById(request.projectId);
			if (!project) {
				return Result.fail(new ProjectNotFoundError());
			}

			return Result.ok(project);
		} catch (error) {
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}
			return Result.fail(new ProjectRetrievalError());
		}
	}
}
