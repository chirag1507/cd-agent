import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { Result } from '../../../../shared/domain/result';
import { Project } from '../../../domain/entities/project.entity';

export interface GetProjectRequest {
	userId: string;
}

export interface GetProjectResult {
	projects: Project[];
}

export type GetProjectErrorTypes = ValidationError | ProjectRetrievalError;

export type GetProjectResponse = Result<Project[], GetProjectErrorTypes>;
