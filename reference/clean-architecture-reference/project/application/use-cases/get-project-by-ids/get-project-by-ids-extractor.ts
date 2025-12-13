import { GetProjectByIdsRequest } from './get-project-by-ids.types';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';
import { SessionData } from '../../../../shared/application/decorators/session-decorator';

export function getProjectByIdsExtractor( decorator:SessionData ,request: HttpRequest): GetProjectByIdsRequest {
	return {
		projectIds: request.query.projectIds as unknown as string[]
	};
}
