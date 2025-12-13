import { ExaminationStatus, Project } from '../../domain/entities/project.entity';
import { ProjectRepository } from '../../domain/interfaces/repositories/project.repository';
import { prisma } from '../../../shared/infrastructure/database/prisma-client';
import { ProjectMapper } from '../mappers/project.mapper';

export class PrismaProjectRepository implements ProjectRepository {
	async save(project: Project): Promise<void> {
		try {
			const persistenceData = ProjectMapper.toPersistence(project);

			await prisma.project.create({
				data: persistenceData
			});
		} catch (error) {
			throw error;
		}
	}

	async findByUserId(userId: string): Promise<Project[]> {
		try {
			const projects = await prisma.project.findMany({
				where: {
					userId: userId
				},
				include: {
					repository: true
				}
			});

			return projects.map((project) => ProjectMapper.toDomain(project));
		} catch (error) {
			throw new Error(
				`Failed to find projects by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async findById(projectId: string): Promise<Project | null> {
		try {
			const project = await prisma.project.findUnique({
				where: {
					id: projectId
				},
				include: {
					repository: true
				}
			});

			return project ? ProjectMapper.toDomain(project) : null;
		} catch (error) {
			throw new Error(
				`Failed to find project by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async findByIds(projectId: string[]): Promise<Project[] > {
		try {
			const projects = await prisma.project.findMany({
				where: { id: { in: projectId } },
				include: {
					repository: true
				}
			});

			if(!projects || projects.length === 0) {
				return [];
			}
			return projects.map((project)=>  ProjectMapper.toDomain(project)) 
		} catch (error) {
			throw new Error(
				`Failed to find project by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async delete(projectId: string): Promise<void> {
		try {
			await prisma.project.delete({
				where: { id: projectId }
			});
		} catch (error) {
			throw new Error(
				`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async updateExaminationStatus(
		projectId: string,
		examinationStatus: ExaminationStatus
	): Promise<Project> {
		try {
			const updatedProject = await prisma.project.update({
				where: {
					id: projectId,
				},
				data: {
					examinationStatus,
					updatedAt: new Date()
				},
				include: {
					repository: true
				}
			});

			return ProjectMapper.toDomain(updatedProject);
		} catch (error) {
			throw new Error(
				`Failed to update project examination status: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
	async getCommitHashByProjectId(projectId: string): Promise<string | null> {
		try {
			const project = await prisma.project.findUnique({
				where: {
					id: projectId
				},
				include: {
					repository: true
				}
			});
			if (!project || !project.repository) {
				return null;
			}

			return project?.repository?.commitHash;
		} catch (error) {
			throw new Error(
				`Failed to fetch the commitHash: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async updateCommitHash(projectId: string, commitHash: string): Promise<void> {
		try {
			await prisma.project.update({
				where: {
					id: projectId
				},
				data: {
					repository: {
						update: {
							commitHash: commitHash
						}
					}
				}
			});
		} catch (error) {
			throw new Error(
				`Failed to update the commitHash: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async isProjectUnderExamination(userId: string) {
		const result = await prisma.project.findFirst({
			where: { userId: userId, examinationStatus: ExaminationStatus.IN_PROGRESS }
		});
		if (result) return true;
		return false;
	}
}
