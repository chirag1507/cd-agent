import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { Result } from '../../../../shared/domain/result';
import { Project } from '../../../domain/entities/project.entity';

export interface GetProjectByIdRequest {
    projectId: string;
}

export interface GetProjectByIdResult {
    project: Project;
}

export type GetProjectByIdErrorTypes = ValidationError | ProjectRetrievalError;

export type GetProjectByIdResponse = Result<Project, GetProjectByIdErrorTypes>;
