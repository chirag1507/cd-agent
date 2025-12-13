import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { GetProjectRequest, GetProjectResponse } from './get-project.types';
import { GetProjectRequestValidator } from './get-project-request-validator';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';

export class GetProjectUseCase implements UseCase<GetProjectRequest, GetProjectResponse> {
	constructor(private readonly projectRepository: ProjectRepository) {}

	async execute(request: GetProjectRequest): Promise<GetProjectResponse> {
		try {
			GetProjectRequestValidator.validate(request);

			const projects = await this.projectRepository.findByUserId(request.userId);
			return Result.ok(projects);
		} catch (error) {
			if (error instanceof ValidationError) {
				return Result.fail(error);
			}
			return Result.fail(new ProjectRetrievalError());
		}
	}
}
