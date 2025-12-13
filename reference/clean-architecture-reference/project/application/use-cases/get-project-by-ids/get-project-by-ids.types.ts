import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { Result } from '../../../../shared/domain/result';
import { Project } from '../../../domain/entities/project.entity';

export interface GetProjectByIdsRequest {
    projectIds: string[];
}

export interface GetProjectByIdsResult {
    project: Project[];
}

export type GetProjectByIdsErrorTypes = ValidationError | ProjectRetrievalError;

export type GetProjectByIdsResponse = Result<Project[], GetProjectByIdsErrorTypes>;
