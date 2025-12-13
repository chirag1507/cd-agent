import { ExaminationStatus } from '../../../domain/entities/project.entity';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { UpdateProjectStatusRequest } from './update-project-status.types';

export class UpdateProjectStatusRequestValidator {
	static validate(request: UpdateProjectStatusRequest): void {
		if (!request.projectId || request.projectId?.trim() === "") {
			throw new ValidationError('Project Id is required');
		}

		if (typeof request.projectId !== "string") {
			throw new ValidationError('Project Id must be string');
		}

		if (!request.examinationStatus || request.examinationStatus?.trim() === "") {
			throw new ValidationError('examinationStatus is required');
		}

		if (!Object.values(ExaminationStatus).includes(request.examinationStatus as ExaminationStatus) ) {
			throw new ValidationError('examinationStatus is not valid');
		}
	
	}
}
