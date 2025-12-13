import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { AddProjectRequest } from './add-project.types';

export class AddProjectRequestValidator {
	static validate(request: AddProjectRequest): void {
		if (!request.userId) {
			throw new ValidationError('User ID is required');
		}
		if (typeof request.userId !== 'string') {
			throw new ValidationError('User ID must be a string');
		}
		if (request.userId.trim() === '') {
			throw new ValidationError('User ID is required');
		}
		if (!request.repoId) {
			throw new ValidationError('Repository ID is required');
		}
		if (typeof request.repoId !== 'number') {
			throw new ValidationError('Repository ID must be a number');
		}
		if (!request.repoName) {
			throw new ValidationError('Repository name is required');
		}
		if (typeof request.repoName !== 'string') {
			throw new ValidationError('Repository name must be a string');
		}
		if (request.repoName.trim() === '') {
			throw new ValidationError('Repository name is required');
		}
		if (!request.name) {
			throw new ValidationError('Project name is required');
		}
		if (typeof request.name !== 'string') {
			throw new ValidationError('Project name must be a string');
		}
		if (request.name.trim() === '') {
			throw new ValidationError('Project name is required');
		}
	}
}
