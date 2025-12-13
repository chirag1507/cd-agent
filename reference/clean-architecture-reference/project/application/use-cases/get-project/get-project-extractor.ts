import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { GetProjectRequest } from './get-project.types';

export function getProjectExtractor(decoded: SessionData): GetProjectRequest {
	return {
		userId: decoded.userId
	};
}
