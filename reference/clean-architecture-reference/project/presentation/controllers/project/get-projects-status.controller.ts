import { Controller } from '../../../../shared/presentation/http/controller';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { HttpResponse } from '../../../../shared/presentation/http/http-response';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { ProjectMapper } from '../../mappers/project.mapper';
import { AuthenticationError } from '../../../../shared/domain/errors/validation.error';
import { GetProjectStatusResponseDto } from '../../interfaces/get-project-status-response.dto';
import { GetProjectByIdsUseCaseFactory } from '../../../../project/application/use-cases/get-project-by-ids/get-project-by-ids.factory';
export class GetProjectStatusController implements Controller {
    constructor(private readonly getProjectByIdsUseCaseFactory: GetProjectByIdsUseCaseFactory) {}

    async handle(httpRequest: HttpRequest, httpResponse: HttpResponse): Promise<any> {
        try {
            console.log("Handling get projects status request with query:", httpRequest.query);
            const getProjectUseCase = this.getProjectByIdsUseCaseFactory.create();

            const result = await getProjectUseCase.execute(httpRequest);

            if (result.isSuccess) {
                const projects = result.getValue();

                return httpResponse.ok<GetProjectStatusResponseDto>({
                    projects: ProjectMapper.getProjectsStatusDto(projects)
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
