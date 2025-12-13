import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { Project } from '../../../domain/entities/project.entity';
import { AddProjectRequest, AddProjectResponse } from './add-project.types';
import {
	ProjectCreationError,
	ProjectAlreadyExists,
	ProjectNameAlreadyExists
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { AddProjectRequestValidator } from './add-project-request-validator';

export class AddProjectUseCase implements UseCase<AddProjectRequest, AddProjectResponse> {
	constructor(private readonly projectRepository: ProjectRepository) {}

	async execute(request: AddProjectRequest): Promise<AddProjectResponse> {
		try {
			AddProjectRequestValidator.validate(request);

			const existingProjects = await this.projectRepository.findByUserId(request.userId);

			const projectExistsWithSameRepo = existingProjects.find(
				(project) => project.repoId === request.repoId
			);

			if (projectExistsWithSameRepo) {
				return Result.fail(new ProjectAlreadyExists());
			}

			const projectExistsWithSameName = existingProjects.find(
				(project) => project.name.toLowerCase() === request.name.toLowerCase()
			);

			if (projectExistsWithSameName) {
				return Result.fail(new ProjectNameAlreadyExists());
			}

			const project = Project.create({
				userId: request.userId,
				repoId: request.repoId,
				repoName: request.repoName,
				name: request.name,
				description: request.description
			});

			await this.projectRepository.save(project);

			return Result.ok({ project });
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
