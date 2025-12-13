import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { ConnectGitProviderUseCaseFactory } from '../../../application/use-cases/connect-git-provider/connect-git-provider.factory';
import {
	GitProviderAuthenticationError,
	GitProviderSavingError
} from '../../../domain/errors/git-provider.error';

export class ConnectGitProviderController implements Controller {
	constructor(
		private readonly connectGitProviderUseCaseFactory: ConnectGitProviderUseCaseFactory
	) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse) {
		try {
			const code = httpRequest.query.code as string;
			const userId = httpRequest.query.state as string;
			const useCase = this.connectGitProviderUseCaseFactory.create();
			const result = await useCase.execute({ code, userId });
			if (result.isSuccess) {
				return httpResponse.redirect(`${process.env.FRONTEND_URL}/onboarding/add-project`);
			}
			const error = result.error();
			if (error instanceof GitProviderAuthenticationError) {
				return httpResponse.redirect(
					`${process.env.FRONTEND_URL}/onboarding/connect-git-provider?error=authentication`
				);
			}
			if (error instanceof GitProviderSavingError) {
				return httpResponse.redirect(
					`${process.env.FRONTEND_URL}/onboarding/connect-git-provider?error=saving`
				);
			}

			return httpResponse.redirect(`${process.env.FRONTEND_URL}/onboarding/add-project`);
		} catch (error) {
			console.error('Unexpected error during git provider connection:', error);
			return httpResponse.redirect(
				`${process.env.FRONTEND_URL}/onboarding/connect-git-provider?error=unexpected`
			);
		}
	}
}
