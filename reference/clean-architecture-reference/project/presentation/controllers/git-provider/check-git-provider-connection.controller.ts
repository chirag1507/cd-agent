import { CheckGitProviderConnectionFactory } from '../../../application/use-cases/check-git-provider-connection/check-git-provider-connection.factory';
import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { Response } from 'express';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class CheckGitProviderConnectionController implements Controller {
	constructor(
		private readonly checkGitProviderConnectionFactory: CheckGitProviderConnectionFactory
	) {}
	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<Response> {
		try {
			const checkGitProviderConnectionUseCase =
				this.checkGitProviderConnectionFactory.create();
			const result = await checkGitProviderConnectionUseCase.execute(httpRequest);

			if (result.isSuccess) {
				const { isConnected } = result.getValue();
				return httpResponse.ok({
					isGitConnected: isConnected
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

			return httpResponse.serverError({
				message: 'An unexpected error occurred while checking the git provider connection'
			});
		} catch (error) {
			console.error('Unexpected error during git provider connection check:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while checking the git provider connection'
			});
		}
	}
}
