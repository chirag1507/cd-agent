import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { CheckGitProviderConnectionRequest } from './check-git-provider-connection.types';

export function checkGitProviderConnectionExtractor(
	decoded: SessionData
): CheckGitProviderConnectionRequest {
	return {
		userId: decoded.userId
	};
}
