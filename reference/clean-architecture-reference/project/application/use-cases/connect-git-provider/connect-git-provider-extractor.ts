import { SessionData } from '../../../../shared/application/decorators/session-decorator';
import { ConnectGitProviderRequest } from './connect-git-provider.types';
import { HttpRequest } from '../../../../shared/presentation/http/http-request';

export function connectGitProviderExtractor(
	decoded: SessionData,
	request: HttpRequest
): ConnectGitProviderRequest {
	return {
		code: request.query.code as string,
		userId: decoded.userId
	};
}
