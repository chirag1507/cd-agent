import { Result } from '../../../../shared/domain/result';
import { GitProviderUrlGenerationError } from '../../../domain/errors/git-provider.error';

export interface GetGitProviderAuthUrlResult {
	url: string;
}

export interface GetGitProviderAuthUrlRequest {
	userId: string;
}

export type GetGitProviderAuthUrlResponse = Result<
	GetGitProviderAuthUrlResult,
	GitProviderUrlGenerationError
>;
