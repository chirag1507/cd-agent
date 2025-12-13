import {
	GitProviderAuthenticationError,
	GitProviderSavingError
} from '../../../domain/errors/git-provider.error';
import { Result } from '../../../../shared/domain/result';

export interface ConnectGitProviderRequest {
	code: string;
	userId: string;
}

export interface ConnectGitProviderResult {
	success: boolean;
	userId?: string;
	provider?: string;
}

export type ConnectGitProviderErrorTypes = GitProviderAuthenticationError | GitProviderSavingError;

export type ConnectGitProviderResponse = Result<
	ConnectGitProviderResult,
	ConnectGitProviderErrorTypes
>;
