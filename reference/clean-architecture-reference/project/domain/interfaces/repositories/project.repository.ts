import { ExaminationStatus, Project } from '../../entities/project.entity';

export interface ProjectRepository {
	save(project: Project): Promise<void>;
	findByUserId(userId: string): Promise<Project[]>;
	findById(projectId: string): Promise<Project | null>;
	findByIds(projectIds: string[]): Promise<Project[]>;
	delete(projectId: string): Promise<void>;
	updateExaminationStatus(
		projectId: string,
		examinationStatus: ExaminationStatus
	): Promise<Project>;
	isProjectUnderExamination(userId:string):Promise<Boolean>

	getCommitHashByProjectId(projectId: string): Promise<string | null>;

	updateCommitHash(projectId: string, commitHash: string): Promise<void>;
}
