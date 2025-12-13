import { GitProviderDeletionError, GitProviderNotFoundError } from '../../../domain/errors/delete-git-provider.error';
import { Result } from '../../../../shared/domain/result';

export interface DeleteGitProviderRequest {
	userId: string;
}

export interface DeleteGitProviderResponseData {
	success: boolean;
}

export type DeleteGitProviderErrorTypes = 
	| GitProviderDeletionError| GitProviderNotFoundError

export type DeleteGitProviderResponse = Result<DeleteGitProviderResponseData, DeleteGitProviderErrorTypes>;
