import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { GetGitProviderAuthUrlFactory } from '../../../application/use-cases/get-git-provider-auth-url/get-git-provider-auth-url.factory';
import { Controller } from '../../../../shared/presentation/http/controller';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class GitProviderAuthUrlController implements Controller {
	constructor(private getGitProviderAuthUrlFactory: GetGitProviderAuthUrlFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const useCase = this.getGitProviderAuthUrlFactory.create();
			const result = await useCase.execute(httpRequest);

			if (result.isSuccess) {
				return httpResponse.ok({
					url: result.getValue().url
				});
			}

			const error = result.error();
			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({
					message: error.message
				});
			}
			return httpResponse.serverError({
				message: error.message
			});
		} catch (error: any) {
			console.error('Unexpected error during git provider auth url:', error);
			return httpResponse.serverError({
				message: error.message
			});
		}
	}
}
