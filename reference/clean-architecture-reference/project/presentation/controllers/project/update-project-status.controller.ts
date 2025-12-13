import {
	ProjectNotFoundError,
	ProjectSavingError,
	ProjectStatusUpdateError
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { UpdateProjectStatusUseCaseFactory } from '../../../application/use-cases/update-project-status/update-project-status.factory';

export class UpdateProjectStatusContoller {
	constructor(private readonly updateProjectUseCaseFactory: UpdateProjectStatusUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const token = httpRequest.headers['x-api-key'];
			if (token !== process.env.UPDATE_PROJECT_STATUS_CALLBACK_API_KEY) {
				return httpResponse.unauthorized({
					message: 'Authentication failed. The token provided is invalid or expired.'
				});
			}
			
			const requestBody = httpRequest.body
			console.log('requestBody', httpRequest.body)

			const payload =
				typeof requestBody.body === 'string'
					? JSON.parse(requestBody.body)
					: requestBody.body;

			const addProjectUseCase = this.updateProjectUseCaseFactory.create();

			const result = await addProjectUseCase.execute({
				projectId: payload.payload.projectId,
				examinationStatus: payload.payload.examinationStatus
			});

			if (result.isSuccess) {
				return httpResponse.ok({
					id: result.getValue().project.id,
					message: 'Project status updated successfully'
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({
					message: error.message
				});
			}

			if (error instanceof ProjectNotFoundError) {
				return httpResponse.conflict({
					message: error.message
				});
			}

			if (error instanceof ProjectStatusUpdateError) {
				return httpResponse.serverError({
					message: error.message
				});
			}

			if (error instanceof ProjectSavingError) {
				return httpResponse.conflict({
					message: error.message
				});
			}
			return httpResponse.serverError({
				message: 'An unexpected error occurred while updating project status'
			});
		} catch(error) {
			console.log(error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while updating project status'
			});
		}
	}
}
