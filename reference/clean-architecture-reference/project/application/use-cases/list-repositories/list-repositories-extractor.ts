import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { ListRepositoriesRequest } from './list-repositories.types';

export function listRepositoriesExtractor(decoded: SessionData): ListRepositoriesRequest {
	return {
		userId: decoded.userId
	};
}
