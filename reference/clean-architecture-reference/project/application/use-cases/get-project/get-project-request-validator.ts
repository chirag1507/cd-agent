import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { GetProjectRequest } from './get-project.types';

export class GetProjectRequestValidator {
	static validate(request: GetProjectRequest): void {
		if (!request.userId) {
			throw new ValidationError('User ID is required');
		}
		if (typeof request.userId !== 'string') {
			throw new ValidationError('User ID must be a string');
		}
		if (request.userId.trim() === '') {
			throw new ValidationError('User ID is required');
		}
	}
}
