import { GetProjectByIdUseCase } from './get-project-by-id.use-case';
import { GetProjectByIdRequest } from './get-project-by-id.types';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import { GetProjectByIdRequestBuilder } from '../../../__test__/builders/get-project-by-id-request.builder';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectNotFoundError, ProjectRetrievalError } from '../../../domain/errors/project.error';

describe('GetProjectByIdUseCase', () => {
	let useCase: GetProjectByIdUseCase;
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

		useCase = new GetProjectByIdUseCase(projectRepository);
	});

	describe('when getting a project by valid ID', () => {
		it('should return project for valid projectId', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('project-123')
				.build();

			const mockProject = new ProjectBuilder()
				.withId('project-123')
				.withRepoId(123)
				.withRepoName('My Project')
				.withName('My Project')
				.withDescription('Project description')
				.build();

			projectRepository.findById.mockResolvedValue(mockProject);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const project = result.getValue();
			expect(project.id).toBe('project-123');
			expect(project.name).toBe('My Project');
			expect(project.userId).toBe('test-user-id');
			expect(projectRepository.findById).toHaveBeenCalledWith('project-123');
		});

		it('should return project with all properties', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('project-456')
				.build();

			const mockProject = new ProjectBuilder()
				.withId('project-456')
				.withRepoId(456)
				.withRepoName('Complete Project')
				.withName('Complete Project')
				.withDescription('Complete project description')
				.build();

			projectRepository.findById.mockResolvedValue(mockProject);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const project = result.getValue();
			expect(project.id).toBe('project-456');
			expect(project.userId).toBe('test-user-id');
			expect(project.repoId).toBe(456);
			expect(project.repoName).toBe('Complete Project');
			expect(project.name).toBe('Complete Project');
			expect(project.description).toBe('Complete project description');
			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
		});
	});

	describe('when project is not found', () => {
		it('should return ProjectRetrievalError when project does not exist', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('non-existent-project')
				.build();

			projectRepository.findById.mockResolvedValue(null);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNotFoundError);
			expect(projectRepository.findById).toHaveBeenCalledWith('non-existent-project');
		});

		it('should return ProjectRetrievalError when project is undefined', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('undefined-project')
				.build();

			projectRepository.findById.mockResolvedValue(undefined as any);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNotFoundError);
			expect(projectRepository.findById).toHaveBeenCalledWith('undefined-project');
		});
	});

	describe('when request data is invalid', () => {
		it.each([
			{
				description: 'empty projectId',
				request: {  projectId: '' },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'null projectId',
				request: {  projectId: null as any },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'undefined projectId',
				request: {  projectId: undefined as any },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'whitespace only projectId',
				request: {  projectId: '   ' },
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'non-string projectId',
				request: {  projectId: 123 as any },
				expectedErrorMessage: 'Project ID must be a string'
			}
		])(
			'should return validation error for $description',
			async ({ request, expectedErrorMessage }) => {
				const result = await useCase.execute(request as GetProjectByIdRequest);

				expect(result.isFailure).toBe(true);
				const error = result.error();
				expect(error).toBeInstanceOf(ValidationError);
				expect((error as ValidationError).message).toContain(expectedErrorMessage);
				expect(projectRepository.findById).not.toHaveBeenCalled();
			}
		);
	});

	describe('when repository operations fail', () => {
		it('should handle repository findById failure gracefully', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('project-123')
				.build();

			projectRepository.findById.mockRejectedValue(
				new Error('Database connection failed')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectRetrievalError);
			expect((error as ProjectRetrievalError).message).toContain(
				'Failed to retrieve project'
			);
			expect(projectRepository.findById).toHaveBeenCalledWith('project-123');
		});

		it('should handle unexpected repository errors', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('project-456')
				.build();

			projectRepository.findById.mockRejectedValue(
				new Error('Unexpected database error')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectRetrievalError);
			expect((error as ProjectRetrievalError).message).toContain(
				'Failed to retrieve project'
			);
			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
		});

		it('should handle validation errors from repository', async () => {
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId('project-789')
				.build();

			const validationError = new ValidationError('Invalid project ID format');
			projectRepository.findById.mockRejectedValue(validationError);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ValidationError);
			expect((error as ValidationError).message).toBe('Invalid project ID format');
			expect(projectRepository.findById).toHaveBeenCalledWith('project-789');
		});
	});

	describe('edge cases', () => {
		it('should handle very long project IDs', async () => {
			const longProjectId = 'a'.repeat(1000);
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId(longProjectId)
				.build();

			const mockProject = new ProjectBuilder()
				.withId(longProjectId)
				.build();

			projectRepository.findById.mockResolvedValue(mockProject);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const project = result.getValue();
			expect(project.id).toBe(longProjectId);
			expect(projectRepository.findById).toHaveBeenCalledWith(longProjectId);
		});

		it('should handle special characters in project ID', async () => {
			const specialProjectId = 'project-123_@#$%^&*()';
			const request = new GetProjectByIdRequestBuilder()
				.withProjectId(specialProjectId)
				.build();

			const mockProject = new ProjectBuilder()
				.withId(specialProjectId)
				.build();

			projectRepository.findById.mockResolvedValue(mockProject);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const project = result.getValue();
			expect(project.id).toBe(specialProjectId);
			expect(projectRepository.findById).toHaveBeenCalledWith(specialProjectId);
		});
	});
});
