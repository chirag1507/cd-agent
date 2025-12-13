import { Controller } from '../../../../shared/presentation/http/controller';
import { DeleteProjectUseCaseFactory } from '../../../application/use-cases/delete-project/delete-project.factory';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectNotFoundError, ProjectDeletionError } from '../../../domain/errors/project.error';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class DeleteProjectController implements Controller {
	constructor(private readonly deleteProjectUseCaseFactory: DeleteProjectUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<any> {
		try {
			const deleteProjectUseCase = this.deleteProjectUseCaseFactory.create();

			const result = await deleteProjectUseCase.execute(httpRequest);

			if (result.isSuccess) {
				return httpResponse.ok({
					message: 'Project deleted successfully'
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({
					message: error.message
				});
			}

			if (error instanceof ProjectNotFoundError) {
				return httpResponse.notFound({
					message: error.message
				});
			}

			if (error instanceof ProjectDeletionError) {
				return httpResponse.serverError({
					message: error.message
				});
			}
			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({
					message: error.message
				});
			}

			return httpResponse.serverError({
				message: 'An unexpected error occurred while deleting the project'
			});
		} catch (error) {
			console.error('Unexpected error during project deletion:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while deleting the project'
			});
		}
	}
}
