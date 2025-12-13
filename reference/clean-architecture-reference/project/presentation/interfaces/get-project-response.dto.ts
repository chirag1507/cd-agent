import { ExaminationStatus } from '../../domain/entities/project.entity';

export interface GetProjectResponseDTO {
	projects: ProjectDto[];
}
export interface ProjectDto {
	id: string;
	name: string;
	description: string | null | undefined;
	repoName: string;
	repoId: number;
	examinationStatus: ExaminationStatus;
}
