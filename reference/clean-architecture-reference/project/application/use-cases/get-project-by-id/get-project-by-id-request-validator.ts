import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { GetProjectByIdRequest } from './get-project-by-id.types';

export class GetProjectByIdRequestValidator {
	static validate(request: GetProjectByIdRequest): void {
		if (!request.projectId) {
			throw new ValidationError('Project ID is required');
		}
		if (typeof request.projectId !== 'string') {
			throw new ValidationError('Project ID must be a string');
		}
		if (request.projectId.trim() === '') {
			throw new ValidationError('Project ID is required');
		}
	}
}
