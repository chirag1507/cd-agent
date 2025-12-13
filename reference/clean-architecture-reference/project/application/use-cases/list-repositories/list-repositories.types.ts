import {
	GitProviderConnectionNotFoundError,
	GitProviderUnavailableError,
	ListRepositoriesError
} from '../../../domain/errors/git-provider.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { Result } from '../../../../shared/domain/result';

export interface ListRepositoriesRequest {
	userId: string;
}

export interface Repository {
	id: number;
	name: string;
	fullName: string;
	isPrivate: boolean;
	hasProject: boolean;
}

export interface ListRepositoriesResult {
	repositories: Repository[];
}

export type ListRepositoriesResponse = Result<
	ListRepositoriesResult,
	| ValidationError
	| GitProviderConnectionNotFoundError
	| ListRepositoriesError
	| GitProviderUnavailableError
>;
