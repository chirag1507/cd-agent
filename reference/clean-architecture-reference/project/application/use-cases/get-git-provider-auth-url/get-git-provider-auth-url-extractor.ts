import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { GetGitProviderAuthUrlRequest } from './get-git-provider-auth-url.types';

export function getGitProviderAuthUrlExtractor(decoded: SessionData): GetGitProviderAuthUrlRequest {
	return {
		userId: decoded.userId
	};
}
