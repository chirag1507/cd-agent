import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { GetProjectByIdRequest } from './get-project-by-id.types';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';

export function getProjectByIdExtractor(decoded: SessionData, request: HttpRequest): GetProjectByIdRequest {
	return {
		projectId: request.params.id as string
	};
}
