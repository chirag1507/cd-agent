import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { DeleteGitProviderUseCaseFactory } from '../../../application/use-cases/delete-git-provider/delete-git-provider.factory';
import {
	GitProviderNotFoundError,
	GitProviderDeletionError
} from '../../../domain/errors/delete-git-provider.error';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class DeleteGitProviderController implements Controller {
	constructor(
		private readonly deleteGitProviderUseCaseFactory: DeleteGitProviderUseCaseFactory
	) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const useCase = this.deleteGitProviderUseCaseFactory.create();
			const result = await useCase.execute(httpRequest);

			if (result.isFailure) {
				const error = result.error();

				if (error instanceof GitProviderNotFoundError) {
					return httpResponse.notFound({
						message: error.message
					});
				}

				if (error instanceof GitProviderDeletionError) {
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
					message: 'An unexpected error occurred during git provider deletion'
				});
			}

			return httpResponse.ok(result.getValue());
		} catch (error) {
			console.error('Unexpected error during git provider deletion:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred'
			});
		}
	}
}
