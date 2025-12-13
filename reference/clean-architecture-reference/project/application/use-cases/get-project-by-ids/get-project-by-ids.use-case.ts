import { UseCase } from '../../../../shared/domain/use-case';
import { Result } from '../../../../shared/domain/result';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { GetProjectByIdsRequest, GetProjectByIdsResponse } from './get-project-by-ids.types';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';
import { GetProjectByIdsRequestValidator } from './get-project-by-ids-request-validator';

export class GetProjectByIdsUseCase implements UseCase<GetProjectByIdsRequest, GetProjectByIdsResponse> {
    constructor(private readonly projectRepository: ProjectRepository) {}

    async execute(request: GetProjectByIdsRequest): Promise<GetProjectByIdsResponse> {
        try {
            GetProjectByIdsRequestValidator.validate(request);

            const project = await this.projectRepository.findByIds(request.projectIds);
            if(!project) {
                return Result.fail(new ProjectRetrievalError());
            }

            return Result.ok(project);
        } catch (error) {
            if (error instanceof ValidationError) {
                return Result.fail(error);
            }
            return Result.fail(new ProjectRetrievalError());
        }
    }
}
