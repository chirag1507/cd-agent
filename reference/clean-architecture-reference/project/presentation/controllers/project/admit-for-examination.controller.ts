import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { AdmitForExaminationUseCaseFactory } from '../../../application/use-cases/admit-for-examination/admit-for-examination.factory';
import {
	ProjectNotFoundError,
	ProjectAlreadyUnderExaminationError,
	ProjectStatusUpdateError,
	ProjectAlreadyScannedError,
	UserExaminationLimitReachedError
} from '../../../domain/errors/project.error';
import { GitProviderNotFoundError } from '../../../domain/errors/delete-git-provider.error';
import {
	ValidationError,
	AuthenticationError
} from '../../../../shared/domain/errors/validation.error';
import { GitRepositoryEmptyError } from '../../../domain/errors/git-provider.error';

export class AdmitForExaminationController implements Controller {
	constructor(
		private readonly admitForExaminationUseCaseFactory: AdmitForExaminationUseCaseFactory
	) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const useCase = this.admitForExaminationUseCaseFactory.create();
			const result = await useCase.execute(httpRequest);

			if (result.isSuccess) {
				const { project } = result.getValue();
				return httpResponse.ok({
					id: project.id,
					status: project.examinationStatus
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({
					message: error.message
				});
			}

			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({
					message: error.message
				});
			}

			if (error instanceof ProjectNotFoundError) {
				return httpResponse.notFound({
					message: error.message
				});
			}

			if (error instanceof GitProviderNotFoundError) {
				return httpResponse.notFound({
					message: 'Git provider authentication not found'
				});
			}

			if (error instanceof ProjectAlreadyUnderExaminationError) {
				return httpResponse.conflict({
					message: error.message
				});
			}

			if (error instanceof ProjectStatusUpdateError) {
				return httpResponse.serverError({
					message: error.message
				});
			}

			if (error instanceof ProjectAlreadyScannedError) {
				return httpResponse.conflict({
					message: error.message
				});
			}
			if (error instanceof UserExaminationLimitReachedError) {
				return httpResponse.conflict({
					message: error.message
				});
			}
			if (error instanceof GitRepositoryEmptyError) {
				return httpResponse.unprocessableEntity({
					message: error.message
				});
			}

			return httpResponse.serverError({
				message: 'An unexpected error occurred while admitting project for examination'
			});
		} catch (error) {
			console.error('Unexpected error during project admission for examination:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while admitting project for examination'
			});
		}
	}
}
