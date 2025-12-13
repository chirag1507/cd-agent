export class GitProviderNotFoundError extends Error {
	readonly code = 'GIT_PROVIDER_NOT_FOUND';

	constructor(message = 'Git provider connection not found') {
		super(message);
		this.name = 'GitProviderNotFoundError';
	}
}

export class GitProviderDeletionError extends Error {
	readonly code = 'GIT_PROVIDER_DELETION_FAILED';

	constructor(message = 'Failed to delete git provider connection') {
		super(message);
		this.name = 'GitProviderDeletionError';
	}
}
