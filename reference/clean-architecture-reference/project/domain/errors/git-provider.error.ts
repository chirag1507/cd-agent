export class GitProviderConnectionError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to connect to Git provider',
		code: string = 'GIT_PROVIDER_CONNECTION_FAILED'
	) {
		super(message);
		this.name = 'GitProviderConnectionError';
		this.code = code;
	}
}

export class GitProviderAuthenticationError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Authentication with Git provider failed',
		code: string = 'GIT_PROVIDER_AUTHENTICATION_FAILED'
	) {
		super(message);
		this.name = 'GitProviderAuthenticationError';
		this.code = code;
	}
}

export class GitProviderSavingError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to save Git provider authentication data',
		code: string = 'GIT_PROVIDER_SAVING_FAILED'
	) {
		super(message);
		this.name = 'GitProviderSavingError';
		this.code = code;
	}
}

export class InvalidGitProviderCodeError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Invalid Git provider authorization code',
		code: string = 'INVALID_GIT_PROVIDER_CODE'
	) {
		super(message);
		this.name = 'InvalidGitProviderCodeError';
		this.code = code;
	}
}

export class GitProviderUnavailableError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Git provider service is temporarily unavailable',
		code: string = 'GIT_PROVIDER_API_UNAVAILABLE'
	) {
		super(message);
		this.name = 'GitProviderUnavailableError';
		this.code = code;
	}
}

export class GitProviderUnAuthorizedError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Git provider unauthorized',
		code: string = 'GIT_PROVIDER_UNAUTHORIZED'
	) {
		super(message);
		this.name = 'GitProviderUnAuthorizedError';
		this.code = code;
	}
}

export class GitProviderConnectionNotFoundError extends Error {
	readonly code: string;

	constructor(
		message: string = 'No git provider connection found for user',
		code: string = 'GIT_PROVIDER_CONNECTION_NOT_FOUND'
	) {
		super(message);
		this.name = 'GitProviderConnectionNotFoundError';
		this.code = code;
	}
}

export class CheckGitProviderConnectionError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to check git provider connection',
		code: string = 'CHECK_GIT_PROVIDER_CONNECTION_FAILED'
	) {
		super(message);
		this.name = 'CheckGitProviderConnectionError';
		this.code = code;
	}
}

export class GitProviderUrlGenerationError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to generate git provider authorization URL',
		code: string = 'GIT_PROVIDER_URL_GENERATION_FAILED'
	) {
		super(message);
		this.name = 'GitProviderUrlGenerationError';
		this.code = code;
	}
}

export class ListRepositoriesError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to list user repositories',
		code: string = 'LIST_USER_REPOSITORIES_FAILED'
	) {
		super(message);
		this.name = 'ListUserRepositoriesError';
		this.code = code;
	}
}

export class GitRepositoryEmptyError extends Error {
	readonly code: string;
	constructor(message = 'Git repository is empty.', code: string = 'GIT_REPOSITORY_EMPTY') {
		super(message);
		this.name = 'GitRepositoryEmptyError';
		this.code = code;
	}
}
