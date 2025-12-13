import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { DeleteProjectRequest } from './delete-project.types';

export class DeleteProjectRequestValidator {
	static validate(request: DeleteProjectRequest): void {
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
