import { Project, ExaminationStatus } from '../../domain/entities/project.entity';
import { Prisma, ExaminationStatus as PrismaExaminationStatus } from '@prisma/client';

export class ProjectMapper {
	static toPersistence(project: Project): Prisma.ProjectCreateInput {
		return {
			id: project.id,
			userId: project.userId,
			name: project.name,
			description: project.description,
			examinationStatus: project.examinationStatus as PrismaExaminationStatus,
			repository: {
				create: {
					repoId: project.repoId,
					repoName: project.repoName,
					commitHash: project.commitHash
				}
			},
			createdAt: project.createdAt,
			updatedAt: project.updatedAt
		};
	}

	static toDomain(project: any): Project {
		return new Project({
			id: project.id,
			userId: project.userId,
			name: project.name,
			description: project.description,
			examinationStatus: project.examinationStatus as ExaminationStatus,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
			deletedAt: project.deletedAt,
			repoId: project.repository.repoId,
			repoName: project.repository.repoName,
			commitHash: project.repository.commitHash
		});
	}
}
