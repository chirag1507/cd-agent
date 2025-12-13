import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { CheckGitProviderConnectionRequest } from './check-git-provider-connection.types';

export class CheckGitProviderConnectionRequestValidator {
	static validate(request: CheckGitProviderConnectionRequest): ValidationError | void {
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
