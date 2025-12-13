import { ExaminationStatus } from '../../domain/entities/project.entity';

export interface GetProjectByIdResponseDTO {
	project: ProjectByIdDto;
}
export interface ProjectByIdDto {
	id: string;
	name: string;
	description: string | null | undefined;
	repoName: string;
	repoId: number;
	examinationStatus: ExaminationStatus;
}
