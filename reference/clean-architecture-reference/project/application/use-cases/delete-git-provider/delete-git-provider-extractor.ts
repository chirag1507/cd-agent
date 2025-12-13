import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { DeleteGitProviderRequest } from './delete-git-provider.types';

export function deleteGitProviderExtractor(decoded: SessionData): DeleteGitProviderRequest {
	return {
		userId: decoded.userId
	};
}
