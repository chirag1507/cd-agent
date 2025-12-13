import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ListRepositoriesRequest } from './list-repositories.types';

export class ListRepositoriesRequestValidator {
	static validate(request: ListRepositoriesRequest): void {
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
