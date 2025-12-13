import {
	ProjectCreationError,
	ProjectSavingError,
	ProjectAlreadyExists
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { Result } from '../../../../shared/domain/result';
import { Project } from '../../../domain/entities/project.entity';

export interface AddProjectRequest {
	userId: string;
	repoId: number;
	repoName: string;
	name: string;
	description?: string;
}

export interface AddProjectResult {
	project: Project;
}

export type AddProjectErrorTypes =
	| ProjectCreationError
	| ProjectSavingError
	| ProjectAlreadyExists
	| ValidationError;

export type AddProjectResponse = Result<AddProjectResult, AddProjectErrorTypes>;
