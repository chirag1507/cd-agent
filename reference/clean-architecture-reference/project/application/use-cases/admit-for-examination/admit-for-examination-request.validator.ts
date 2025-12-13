import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { AdmitForExaminationRequest } from './admit-for-examination.types';

export class AdmitForExaminationRequestValidator {
	static validate(request: AdmitForExaminationRequest): void {
		if (!request.userId) {
			throw new ValidationError('User ID is required');
		}
		if (typeof request.userId !== 'string') {
			throw new ValidationError('User ID must be a string');
		}
		if (!request.userId.trim()) {
			throw new ValidationError('User ID is required');
		}
		if (!request.projectId) {
			throw new ValidationError('Project ID is required');
		}
		if (typeof request.projectId !== 'string') {
			throw new ValidationError('Project ID must be a string');
		}
		if (!request.projectId.trim()) {
			throw new ValidationError('Project ID is required');
		}
	}
}
