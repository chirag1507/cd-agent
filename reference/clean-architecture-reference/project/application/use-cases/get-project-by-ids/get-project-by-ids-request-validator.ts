import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { GetProjectByIdsRequest } from './get-project-by-ids.types';

export class GetProjectByIdsRequestValidator {
	static validate(request: GetProjectByIdsRequest): void {
		if (!request.projectIds || request.projectIds.length === 0) {
			throw new ValidationError('Project ID is required');
		}
		if ( !Array.isArray(request.projectIds)) {
			throw new ValidationError('Project ID must be a array');
		}
		for (const id of request.projectIds) {
			if (typeof id !== 'string') {
				throw new ValidationError('Each Project ID must be a string');
			}
			if (id.trim() === '') {
				throw new ValidationError('Project ID cannot be empty');
			}
		}
		if (request.projectIds.length === 0) {
			throw new ValidationError('At least one Project ID is required');
		}
	}
}
