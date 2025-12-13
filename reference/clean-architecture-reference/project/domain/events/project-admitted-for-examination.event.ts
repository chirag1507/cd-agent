import { randomUUID } from 'crypto';
import { DomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ExaminationStatus } from '../entities/project.entity';

export interface ProjectAdmittedForExaminationPayload {
	projectId: string;
	userId: string;
	accessToken: string;
	previousStatus: ExaminationStatus;
	newStatus: ExaminationStatus;
	admittedBy: string;
	admittedAt: string;
	repoId: string;
	repoFullName: string;
	repoBranchName: string;
	repoCommitHash: string;
}
export class ProjectAdmittedForExaminationEvent implements DomainEvent {
	public readonly eventId: string;
	public readonly eventType: string = 'ProjectAdmittedForExamination';
	public readonly occurredAt: Date;
	public readonly version: number = 1;
	public readonly aggregateId: string;
	public readonly aggregateType: string = 'Project';
	public readonly payload: ProjectAdmittedForExaminationPayload;

	constructor(props: {
		projectId: string;
		userId: string;
		accessToken: string;
		previousStatus: ExaminationStatus;
		newStatus: ExaminationStatus;
		admittedBy: string;
		repoId: string;
		repoBranchName: string;
		repoCommitHash: string;
		repoFullName: string;
	}) {
		this.eventId = randomUUID();
		this.occurredAt = new Date();
		this.aggregateId = props.projectId;
		this.payload = {
			projectId: props.projectId,
			userId: props.userId,
			accessToken: props.accessToken,
			previousStatus: props.previousStatus,
			newStatus: props.newStatus,
			admittedBy: props.admittedBy,
			admittedAt: this.occurredAt.toISOString(),
			repoId: props.repoId,
			repoBranchName: props.repoBranchName,
			repoCommitHash: props.repoCommitHash,
			repoFullName: props.repoFullName
		};
	}
}
