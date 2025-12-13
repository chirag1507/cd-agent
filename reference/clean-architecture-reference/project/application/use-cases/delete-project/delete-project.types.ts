import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectNotFoundError, ProjectDeletionError } from '../../../domain/errors/project.error';
import { Result } from '../../../../shared/domain/result';

export interface DeleteProjectRequest {
	projectId: string;
}

export type DeleteProjectResponse = Result<
	{ success: true },
	ValidationError | ProjectNotFoundError | ProjectDeletionError
>;
