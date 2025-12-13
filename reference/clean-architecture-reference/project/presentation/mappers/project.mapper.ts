import { Project } from '../../domain/entities/project.entity';
import { ProjectDto } from '../interfaces/get-project-response.dto';
import { GetProjectStatusDto } from '../interfaces/get-project-status-response.dto';

export class ProjectMapper {
	static getProjectsDto(projects: Project[]): ProjectDto[] {
		const sortedProjects = projects.sort(
			(a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
		);
		return sortedProjects.map((project) => ({
			id: project.id,
			name: project.name,
			description: project.description,
			repoName: project.repoName,
			repoId: project.repoId,
			examinationStatus: project.examinationStatus
		}));
	}
	static getProjectsStatusDto(projects: Project[]): GetProjectStatusDto[] {
		return projects.map((project) => ({
			id: project.id,
			examinationStatus: project.examinationStatus
		}));
	}

	static getProjectByIdDto(project: Project) {
		return {
			id: project.id,
			name: project.name,
			description: project.description,
			repoName: project.repoName,
			repoId: project.repoId,
			examinationStatus: project.examinationStatus
		};
	}
}
