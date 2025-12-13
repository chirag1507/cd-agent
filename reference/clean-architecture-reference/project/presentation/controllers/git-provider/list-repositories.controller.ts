import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { Response } from 'express';
import { ListRepositoriesUseCaseFactory } from '../../../application/use-cases/list-repositories/list-repositories.factory';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import {
	GitProviderConnectionNotFoundError,
	GitProviderUnavailableError,
	ListRepositoriesError
} from '../../../domain/errors/git-provider.error';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class ListRepositoriesController implements Controller {
	constructor(private readonly listRepositoriesUseCaseFactory: ListRepositoriesUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<Response> {

		try {
			const useCase = this.listRepositoriesUseCaseFactory.create();
			const result = await useCase.execute(httpRequest);

			if (result.isSuccess) {
				const { repositories } = result.getValue();
				return httpResponse.ok({
					repositories
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({ message: error.message });
			}

			if (error instanceof GitProviderConnectionNotFoundError) {
				return httpResponse.notFound({ message: error.message });
			}

			if (error instanceof ListRepositoriesError) {
				return httpResponse.serverError({ message: error.message });
			}

			if (error instanceof GitProviderUnavailableError) {
				return httpResponse.badGateway({ message: error.message });
			}
			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({ message: error.message });
			}

			return httpResponse.serverError({
				message: 'An unexpected error occurred while listing repositories'
			});
		} catch (error) {
			console.error('Unexpected error during repository listing:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while listing repositories'
			});
		}
	}
}
