import { Controller } from '../../../../shared/presentation/http/controller';
import { GetProjectUseCaseFactory } from '../../../application/use-cases/get-project/get-project.factory';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { ProjectMapper } from '../../mappers/project.mapper';
import { GetProjectResponseDTO } from '../../interfaces/get-project-response.dto';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
export class GetProjectController implements Controller {
	constructor(private readonly getProjectUseCaseFactory: GetProjectUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<any> {
		try {
			const getProjectUseCase = this.getProjectUseCaseFactory.create();

			const result = await getProjectUseCase.execute(httpRequest);

			if (result.isSuccess) {
				const projects = result.getValue();

				return httpResponse.ok<GetProjectResponseDTO>({
					projects: ProjectMapper.getProjectsDto(projects)
				});
			}

			const error = result.error();

			if (error instanceof ValidationError) {
				return httpResponse.badRequest({
					message: error.message
				});
			}

			if (error instanceof ProjectRetrievalError) {
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
				message: 'An unexpected error occurred while retrieving projects'
			});
		} catch (error) {
			console.error('Unexpected error during project retrieval:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while retrieving projects'
			});
		}
	}
}
