import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { AddProjectUseCaseFactory } from '../../../application/use-cases/add-project/add-project.factory';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import {
	ProjectAlreadyExists,
	ProjectCreationError,
	ProjectNameAlreadyExists
} from '../../../domain/errors/project.error';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class AddProjectController implements Controller {
	constructor(private readonly addProjectUseCaseFactory: AddProjectUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const addProjectUseCase = this.addProjectUseCaseFactory.create();

			const result = await addProjectUseCase.execute(httpRequest);

			if (result.isSuccess) {
				return httpResponse.created({
					id: result.getValue().project.id,
					message: 'Project added successfully'
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({
					message: error.message
				});
			}

			if (error instanceof ProjectAlreadyExists) {
				return httpResponse.conflict({
					message: error.message
				});
			}

			if (error instanceof ProjectCreationError) {
				return httpResponse.serverError({
					message: error.message
				});
			}
			if (error instanceof ProjectNameAlreadyExists) {
				return httpResponse.conflict({
					message: error.message
				});
			}
			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({
					message: error.message
				});
			}

			return httpResponse.serverError({
				message: 'An unexpected error occurred while adding the project'
			});
		} catch {
			return httpResponse.serverError({
				message: 'An unexpected error occurred while adding the project'
			});
		}
	}
}
