export class ProjectCreationError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to create project',
		code: string = 'PROJECT_CREATION_FAILED'
	) {
		super(message);
		this.name = 'ProjectCreationError';
		this.code = code;
	}
}

export class ProjectSavingError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to save project',
		code: string = 'PROJECT_SAVING_FAILED'
	) {
		super(message);
		this.name = 'ProjectSavingError';
		this.code = code;
	}
}

export class ProjectAlreadyExists extends Error {
	readonly code: string;

	constructor(
		message: string = 'Project with this repository already exists',
		code: string = 'DUPLICATE_REPOSITORY'
	) {
		super(message);
		this.name = 'ProjectAlreadyExists';
		this.code = code;
	}
}

export class ProjectNameAlreadyExists extends Error {
	readonly code: string;

	constructor(
		message: string = 'Project with this name already exists',
		code: string = 'DUPLICATE_PROJECT_NAME'
	) {
		super(message);
		this.name = 'ProjectNameAlreadyExists';
		this.code = code;
	}
}

export class ProjectRetrievalError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to retrieve projects',
		code: string = 'PROJECT_RETRIEVAL_FAILED'
	) {
		super(message);
		this.name = 'ProjectRetrievalError';
		this.code = code;
	}
}

export class ProjectNotFoundError extends Error {
	readonly code: string;

	constructor(message: string = 'Project not found', code: string = 'PROJECT_NOT_FOUND') {
		super(message);
		this.name = 'ProjectNotFoundError';
		this.code = code;
	}
}

export class ProjectDeletionError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to delete project',
		code: string = 'PROJECT_DELETION_FAILED'
	) {
		super(message);
		this.name = 'ProjectDeletionError';
		this.code = code;
	}
}

export class UserExaminationLimitReachedError extends Error {
	readonly code: string;

	constructor(
		message: string = 'User already has a project under examination',
		code: string = 'USER_EXAMINATION_LIMIT_REACHED'
	) {
		super(message);
		this.name = 'UserExaminationLimitReachedError';
		this.code = code;
	}
}

export class ProjectAccessDeniedError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Access denied: You can only delete your own projects',
		code: string = 'PROJECT_ACCESS_DENIED'
	) {
		super(message);
		this.name = 'ProjectAccessDeniedError';
		this.code = code;
	}
}

export class ProjectAlreadyUnderExaminationError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Project is already under examination',
		code: string = 'PROJECT_ALREADY_UNDER_EXAMINATION'
	) {
		super(message);
		this.name = 'ProjectAlreadyUnderExaminationError';
		this.code = code;
	}
}

export class ProjectStatusUpdateError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Failed to admit project for examination',
		code: string = 'PROJECT_STATUS_UPDATE_FAILED'
	) {
		super(message);
		this.name = 'ProjectStatusUpdateError';
		this.code = code;
	}
}

export class ProjectAlreadyScannedError extends Error {
	readonly code: string;

	constructor(
		message: string = 'Project repository is already scanned for this commit',
		code: string = 'PROJECT_ALREADY_SCANNED'
	) {
		super(message);
		this.name = 'ProjectAlreadyScannedError';
		this.code = code;
	}
}
