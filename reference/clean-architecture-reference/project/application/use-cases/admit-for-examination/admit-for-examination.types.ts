import { Result } from '../../../../shared/domain/result';
import { Project } from '../../../domain/entities/project.entity';
import {
	ProjectNotFoundError,
	ProjectAccessDeniedError,
	ProjectAlreadyUnderExaminationError,
	ProjectStatusUpdateError,
	UserExaminationLimitReachedError
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';

export interface AdmitForExaminationRequest {
	userId: string;
	projectId: string;
}

export interface AdmitForExaminationResult {
	project: Project;
}

export type AdmitForExaminationErrorTypes =
	| ValidationError
	| ProjectNotFoundError
	| ProjectAccessDeniedError
	| ProjectAlreadyUnderExaminationError
	| ProjectStatusUpdateError
	| UserExaminationLimitReachedError

export type AdmitForExaminationResponse = Result<
	AdmitForExaminationResult,
	AdmitForExaminationErrorTypes
>;
