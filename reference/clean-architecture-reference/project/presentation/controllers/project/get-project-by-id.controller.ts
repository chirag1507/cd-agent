import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError, ProjectNotFoundError } from '../../../domain/errors/project.error';
import { ProjectMapper } from '../../mappers/project.mapper';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
import { GetProjectByIdUseCaseFactory } from '../../../application/use-cases/get-project-by-id/get-project-by-id.factory';
import { GetProjectByIdResponseDTO } from '../../interfaces/get-project-by-id-response.dto';
export class GetProjectByIdController implements Controller {
	constructor(private readonly getProjectByIdUseCaseFactory: GetProjectByIdUseCaseFactory) {}

	async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<any> {
		try {
			const getProjectByIdUseCase = this.getProjectByIdUseCaseFactory.create();

			const result = await getProjectByIdUseCase.execute(httpRequest);

			if (result.isSuccess) {
				const project = result.getValue();

				return httpResponse.ok<GetProjectByIdResponseDTO>({
					project: ProjectMapper.getProjectByIdDto(project)
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

			if (error instanceof ProjectNotFoundError) {
				return httpResponse.notFound({
					message: error.message
				});
			}
			if (error instanceof AuthenticationError) {
				return httpResponse.unauthorized({
					message: error.message
				});
			}

			return httpResponse.serverError({
				message: 'An unexpected error occurred while retrieving project'
			});
		} catch (error) {
			console.error('Unexpected error during project retrieval:', error);
			return httpResponse.serverError({
				message: 'An unexpected error occurred while retrieving project'
			});
		}
	}
}
