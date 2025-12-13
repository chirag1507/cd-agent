import {
	ProjectSavingError,
	ProjectStatusUpdateError,
	ProjectNotFoundError
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { Result } from '../../../../shared/domain/result';
import { ExaminationStatus, Project } from '../../../domain/entities/project.entity';

export interface UpdateProjectStatusRequest {
	projectId:string
	examinationStatus:ExaminationStatus
}

export interface UpdateProjectStatusResult {
	project: Project;
}

export type UpdateProjectStatusErrorTypes =
	| ProjectNotFoundError
	| ProjectStatusUpdateError
	| ProjectSavingError
	| ValidationError;

export type UpdateProjectStatusResponse = Result<UpdateProjectStatusResult, UpdateProjectStatusErrorTypes>;
