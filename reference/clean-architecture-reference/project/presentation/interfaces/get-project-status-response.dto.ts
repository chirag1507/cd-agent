import { ExaminationStatus } from '../../domain/entities/project.entity';


export interface GetProjectStatusResponseDto {
projects: GetProjectStatusDto[];
}
export interface GetProjectStatusDto {
	id: string;
    examinationStatus: ExaminationStatus;
}
