import { PrismaClient } from '@prisma/client';
import { PrismaProjectRepository } from '../repositories/project.repository';
import { Project, ExaminationStatus } from '../../domain/entities/project.entity';
import { ProjectBuilder } from '../../__test__/builders/project.builder';

describe('PrismaProjectRepository (Narrow Integration)', () => {
	let prisma: PrismaClient;
	let projectRepository: PrismaProjectRepository;
	let createdProjectIds: string[] = [];

	const saveProjectAndTrack = async (project: Project): Promise<void> => {
		await projectRepository.save(project);
		createdProjectIds.push(project.id);
	};

	beforeAll(async () => {
		prisma = new PrismaClient();
		await prisma.$connect();
		projectRepository = new PrismaProjectRepository();
	});

	beforeEach(async () => {
		createdProjectIds = [];
	});

	afterEach(async () => {
		if (createdProjectIds.length > 0) {
			await prisma.project.deleteMany({
				where: { id: { in: createdProjectIds } }
			});
		}
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	describe('save', () => {
		it('should save a new project to the database', async () => {
			const newProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('test-repository')
				.withName('Test Project')
				.withDescription('A test project')
				.create();

			await saveProjectAndTrack(newProject);

			const savedProjectInDb = await prisma.project.findFirst({
				where: {
					id: newProject.id
				},
				include: {
					repository: true
				}
			});
			expect(savedProjectInDb).not.toBeNull();
			expect(savedProjectInDb?.id).toBe(newProject.id);
			expect(savedProjectInDb?.userId).toBe(newProject.userId);
			expect(savedProjectInDb?.repository?.repoId).toBe(newProject.repoId);
			expect(savedProjectInDb?.repository?.repoName).toBe(newProject.repoName);
			expect(savedProjectInDb?.name).toBe(newProject.name);
			expect(savedProjectInDb?.description).toBe(newProject.description);
			expect(savedProjectInDb?.examinationStatus).toBe(newProject.examinationStatus);
			expect(savedProjectInDb?.createdAt).toBeInstanceOf(Date);
			expect(savedProjectInDb?.updatedAt).toBeInstanceOf(Date);
		});

		it('should save a project without description (optional field)', async () => {
			const newProject = new ProjectBuilder()
				.withUserId('user-456')
				.withRepoId(789)
				.withRepoName('minimal-project')
				.withName('Minimal Project')
				.build();

			await saveProjectAndTrack(newProject);

			const savedProjectInDb = await prisma.project.findFirst({
				where: {
					id: newProject.id
				}
			});
			expect(savedProjectInDb).not.toBeNull();
			expect(savedProjectInDb?.id).toBe(newProject.id);
			expect(savedProjectInDb?.description).toBe(newProject.description);
		});
	});

	describe('findByUserId', () => {
		it('should return project entities when projects exist for the given userId', async () => {
			const userId = 'user-find-test';
			const project1 = new ProjectBuilder()
				.withUserId(userId)
				.withRepoId(111)
				.withRepoName('project-1')
				.withName('Project 1')
				.create();
			const project2 = new ProjectBuilder()
				.withUserId(userId)
				.withRepoId(222)
				.withRepoName('project-2')
				.withName('Project 2')
				.create();

			await saveProjectAndTrack(project1);
			await saveProjectAndTrack(project2);

			const foundProjects = await projectRepository.findByUserId(userId);

			expect(foundProjects).toHaveLength(2);
			expect(foundProjects[0]).toBeInstanceOf(Project);
			expect(foundProjects[1]).toBeInstanceOf(Project);

			const projectIds = foundProjects.map((p) => p.id);
			expect(projectIds).toContain(project1.id);
			expect(projectIds).toContain(project2.id);
		});

		it('should return empty array when no projects exist for the given userId', async () => {
			const userId = 'user-no-projects';

			const foundProjects = await projectRepository.findByUserId(userId);

			expect(foundProjects).toHaveLength(0);
		});
	});

	describe('findById', () => {
		it('should return a project entity when a project with the given ID exists', async () => {
			const newProject = new ProjectBuilder()
				.withUserId('user-findById')
				.withRepoId(555)
				.withRepoName('findById-project')
				.withName('Find By ID Project')
				.withDescription('Project for findById test')
				.create();

			await saveProjectAndTrack(newProject);

			const foundProject = await projectRepository.findById(newProject.id);

			expect(foundProject).toBeInstanceOf(Project);
			expect(foundProject?.id).toBe(newProject.id);
			expect(foundProject?.userId).toBe(newProject.userId);
			expect(foundProject?.repoId).toBe(newProject.repoId);
			expect(foundProject?.name).toBe(newProject.name);
			expect(foundProject?.description).toBe(newProject.description);
		});

		it('should return null when no project with the given ID exists', async () => {
			const nonExistentId = 'non-existent-project-id-123';

			const foundProject = await projectRepository.findById(nonExistentId);

			expect(foundProject).toBeNull();
		});
	});

	describe('delete', () => {
		it('should delete a project  successfully of a user for given project id', async () => {
			const userId = 'user-delete-test';
			const newProject = new ProjectBuilder().withUserId(userId).create();

			await saveProjectAndTrack(newProject);

			const projectBeforeDelete = await projectRepository.findById(newProject.id);
			expect(projectBeforeDelete).not.toBeNull();
			expect(projectBeforeDelete?.name).toBe(newProject.name);

			const userProjectsBeforeDelete = await projectRepository.findByUserId(userId);
			expect(userProjectsBeforeDelete).toHaveLength(1);
			expect(userProjectsBeforeDelete[0].id).toBe(newProject.id);

			await projectRepository.delete(newProject.id);

			const foundById = await projectRepository.findById(newProject.id);
			const foundByUserId = await projectRepository.findByUserId(userId);

			expect(foundById).toBeNull();
			expect(foundByUserId).toHaveLength(0);
		});

		it('should handle deletion of non-existent project gracefully', async () => {
			const nonExistentId = 'non-existent-project-for-delete';

			await expect(projectRepository.delete(nonExistentId)).rejects.toThrow();
		});
	});

	describe('updateExaminationStatus', () => {
		it('should update examination status from PENDING to IN_PROGRESS', async () => {
			const newProject = new ProjectBuilder()
				.withUserId('user-status-test')
				.withRepoId(777)
				.withRepoName('status-test-repo')
				.withName('Status Test Project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.create();

			await saveProjectAndTrack(newProject);

			const updatedProject = await projectRepository.updateExaminationStatus(
				newProject.id,
				ExaminationStatus.IN_PROGRESS
			);

			expect(updatedProject).toBeInstanceOf(Project);
			expect(updatedProject.id).toBe(newProject.id);
			expect(updatedProject.examinationStatus).toBe(ExaminationStatus.IN_PROGRESS);
			expect(updatedProject.userId).toBe(newProject.userId);
			expect(updatedProject.name).toBe(newProject.name);
		});

		it('should throw error when updating non-existent project', async () => {
			const nonExistentId = 'non-existent-project-for-status-update';

			await expect(
				projectRepository.updateExaminationStatus(
					nonExistentId,
					ExaminationStatus.IN_PROGRESS
				)
			).rejects.toThrow();
		});
	});
});
