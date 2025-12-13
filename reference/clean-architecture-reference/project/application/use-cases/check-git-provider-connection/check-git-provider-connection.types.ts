import { Result } from '../../../../shared/domain/result';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { CheckGitProviderConnectionError } from '../../../domain/errors/git-provider.error';

export interface CheckGitProviderConnectionRequest {
	userId: string;
}

export interface CheckGitProviderConnectionResult {
	isConnected: boolean;
}

export type CheckGitProviderConnectionResponse = Result<
	CheckGitProviderConnectionResult,
	ValidationError | CheckGitProviderConnectionError
>;
