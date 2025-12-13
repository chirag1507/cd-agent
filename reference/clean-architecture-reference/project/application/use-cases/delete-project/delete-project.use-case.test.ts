import { DeleteProjectRequest } from './delete-project.types';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import { DeleteProjectRequestBuilder } from '../../../__test__/builders/delete-project-request.builder';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectNotFoundError, ProjectDeletionError } from '../../../domain/errors/project.error';
import { DeleteProjectUseCase } from './delete-project.use-case';

describe('DeleteProjectUseCase', () => {
	let useCase: DeleteProjectUseCase;
	let projectRepository: jest.Mocked<ProjectRepository>;

	beforeEach(() => {
	projectRepository = {
		save: jest.fn(),
		findByUserId: jest.fn(),
		findById: jest.fn(),
		delete: jest.fn(),
		updateExaminationStatus: jest.fn(),
		findByIds: jest.fn(),
		getCommitHashByProjectId: jest.fn(),
		updateCommitHash: jest.fn(),
		isProjectUnderExamination: jest.fn()
	};

		useCase = new DeleteProjectUseCase(projectRepository);
	});

	describe('when deleting a project successfully', () => {
		it('should delete project when project exists', async () => {
			const request = new DeleteProjectRequestBuilder().withProjectId('project-123').build();

			const existingProject = new ProjectBuilder()
				.withId('project-123')
				.withUserId('user-456')
				.withName('My Project')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			projectRepository.delete.mockResolvedValue(undefined);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const response = result.getValue();
			expect(response.success).toBe(true);
			expect(projectRepository.findById).toHaveBeenCalledWith('project-123');
			expect(projectRepository.delete).toHaveBeenCalledWith('project-123');
		});
	});

	describe('when project does not exist', () => {
		it('should return ProjectNotFoundError when project does not exist', async () => {
			const request = new DeleteProjectRequestBuilder()
				.withProjectId('non-existent-project')
				.build();

			projectRepository.findById.mockResolvedValue(null);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNotFoundError);
			expect((error as ProjectNotFoundError).message).toContain('Project not found');
			expect(projectRepository.findById).toHaveBeenCalledWith('non-existent-project');
			expect(projectRepository.delete).not.toHaveBeenCalled();
		});
	});

	describe('when request data is invalid', () => {
		it.each([
			{
				description: 'empty projectId',
				request: { projectId: '' },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'null projectId',
				request: { projectId: null as any },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'undefined projectId',
				request: { projectId: undefined as any },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'whitespace only projectId',
				request: { projectId: '   ' },
				expectedErrorMessage: 'Project ID is required'
			}
		])(
			'should return validation error for $description',
			async ({ request, expectedErrorMessage }) => {
				const result = await useCase.execute(request as DeleteProjectRequest);

				expect(result.isFailure).toBe(true);
				const error = result.error();
				expect(error).toBeInstanceOf(ValidationError);
				expect((error as ValidationError).message).toContain(expectedErrorMessage);
				expect(projectRepository.findById).not.toHaveBeenCalled();
				expect(projectRepository.delete).not.toHaveBeenCalled();
			}
		);
	});

	describe('when repository operations fail', () => {
		it('should handle repository findById failure gracefully', async () => {
			const request = new DeleteProjectRequestBuilder().withProjectId('project-123').build();

			projectRepository.findById.mockRejectedValue(new Error('Database connection failed'));

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectDeletionError);
			expect((error as ProjectDeletionError).message).toContain('Failed to delete project');
			expect(projectRepository.findById).toHaveBeenCalledWith('project-123');
			expect(projectRepository.delete).not.toHaveBeenCalled();
		});

		it('should handle repository delete failure gracefully', async () => {
			const request = new DeleteProjectRequestBuilder().withProjectId('project-123').build();

			const existingProject = new ProjectBuilder()
				.withId('project-123')
				.withUserId('user-456')
				.withName('My Project')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			projectRepository.delete.mockRejectedValue(new Error('Database deletion failed'));

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectDeletionError);
			expect((error as ProjectDeletionError).message).toContain('Failed to delete project');
			expect(projectRepository.findById).toHaveBeenCalledWith('project-123');
			expect(projectRepository.delete).toHaveBeenCalledWith('project-123');
		});
	});
});
