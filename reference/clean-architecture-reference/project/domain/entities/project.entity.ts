import { randomUUID } from 'crypto';

export interface ProjectProps {
	id: string;
	userId: string;
	repoId: number;
	repoName: string;
	name: string;
	description?: string | null;
	deletedAt?: Date | null;
	updatedAt?: Date;
	createdAt?: Date;
	examinationStatus: ExaminationStatus;
	commitHash?: string | null;
}

//Need to clarify
export enum ExaminationStatus {
	PENDING = 'PENDING',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED'
}

export class Project {
	constructor(private props: ProjectProps) {}

	static create(
		props: Omit<ProjectProps, 'id' | 'createdAt' | 'updatedAt' | 'examinationStatus'>
	): Project {
		return new Project({
			...props,
			id: randomUUID(),
			examinationStatus: ExaminationStatus.PENDING,
			createdAt: new Date(),
			updatedAt: new Date()
		});
	}

	get id(): string {
		return this.props.id;
	}

	get userId(): string {
		return this.props.userId;
	}

	get repoId(): number {
		return this.props.repoId;
	}

	get repoName(): string {
		return this.props.repoName;
	}

	get name(): string {
		return this.props.name;
	}

	get description(): string | undefined | null {
		return this.props.description;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get examinationStatus(): ExaminationStatus {
		return this.props.examinationStatus;
	}

	admitForExamination(): void {
		if (this.props.examinationStatus === ExaminationStatus.IN_PROGRESS) {
			throw new Error('Project is already under examination');
		}

		this.props.examinationStatus = ExaminationStatus.IN_PROGRESS;
		this.props.updatedAt = new Date();
	}

	get commitHash(): string | null | undefined {
		return this.props.commitHash;
	}
}
