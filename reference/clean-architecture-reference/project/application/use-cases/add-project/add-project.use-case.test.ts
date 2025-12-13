import { AddProjectUseCase } from './add-project.use-case';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { AddProjectRequest } from './add-project.types';
import { AddProjectRequestBuilder } from '../../../__test__/builders/add-project-request.builder';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import {
	ProjectCreationError,
	ProjectAlreadyExists,
	ProjectNameAlreadyExists
} from '../../../domain/errors/project.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';

describe('AddProjectUseCase', () => {
	let useCase: AddProjectUseCase;
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

		useCase = new AddProjectUseCase(projectRepository);
	});

	describe('when adding a valid project', () => {
		it('should successfully create and save a new project', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('my-awesome-repo')
				.withName('My Awesome Project')
				.withDescription('This is a great project')
				.buildWithAllFields();

			projectRepository.findByUserId.mockResolvedValue([]);
			projectRepository.save.mockResolvedValue(undefined);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBeDefined();

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).toHaveBeenCalledTimes(1);
		});

		it('should successfully create a project without description (optional field)', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('my-awesome-repo')
				.withName('My Awesome Project')
				.build() as AddProjectRequest;

			projectRepository.findByUserId.mockResolvedValue([]);
			projectRepository.save.mockResolvedValue(undefined);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBeDefined();

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).toHaveBeenCalledTimes(1);
		});
	});

	describe('when user already has projects', () => {
		it('should successfully create a second project with different repository', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('my-second-repo')
				.withName('My Second Project')
				.buildWithAllFields();

			const existingProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(123)
				.withRepoName('existing-repo')
				.withName('Existing Project')
				.create();

			projectRepository.findByUserId.mockResolvedValue([existingProject]);
			projectRepository.save.mockResolvedValue(undefined);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);

			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBeDefined();

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).toHaveBeenCalledTimes(1);
		});

		it('should return validation error when user tries to add project with duplicate repository', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(123)
				.withRepoName('existing-repo')
				.withName('My Duplicate Repo Project')
				.buildWithAllFields();

			const existingProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(123)
				.withRepoName('existing-repo')
				.withName('Existing Project')
				.create();

			projectRepository.findByUserId.mockResolvedValue([existingProject]);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectAlreadyExists);
			expect(error.message).toContain('Project with this repository already exists');

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).not.toHaveBeenCalled();
		});

		it('should return validation error when user tries to add project with duplicate name', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('different-repo')
				.withName('My Awesome Project')
				.buildWithAllFields();

			const existingProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(789)
				.withRepoName('another-repo')
				.withName('My Awesome Project')
				.create();

			projectRepository.findByUserId.mockResolvedValue([existingProject]);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNameAlreadyExists);
			expect(error.message).toContain('Project with this name already exists');

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).not.toHaveBeenCalled();
		});

		it('should return validation error when user tries to add project with duplicate name (case-insensitive)', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('different-repo')
				.withName('my awesome project')
				.buildWithAllFields();

			const existingProject = new ProjectBuilder()
				.withUserId('user-123')
				.withRepoId(789)
				.withRepoName('another-repo')
				.withName('My Awesome Project')
				.create();

			projectRepository.findByUserId.mockResolvedValue([existingProject]);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNameAlreadyExists);
			expect(error.message).toContain('Project with this name already exists');

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).not.toHaveBeenCalled();
		});
	});

	describe('when request data is invalid', () => {
		it.each([
			{
				description: 'empty userId',
				request: {
					userId: '',
					repoId: 123,
					repoName: 'test-repo',
					name: 'Test Project'
				},
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'null userId',
				request: {
					userId: null as any,
					repoId: 123,
					repoName: 'test-repo',
					name: 'Test Project'
				},
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'empty repoName',
				request: {
					userId: 'user-123',
					repoId: 123,
					repoName: '',
					name: 'Test Project'
				},
				expectedErrorMessage: 'Repository name is required'
			},
			{
				description: 'empty name',
				request: {
					userId: 'user-123',
					repoId: 123,
					repoName: 'test-repo',
					name: ''
				},
				expectedErrorMessage: 'Project name is required'
			},
			{
				description: 'missing repoId',
				request: {
					userId: 'user-123',
					repoName: 'test-repo',
					name: 'Test Project'
				},
				expectedErrorMessage: 'Repository ID is required'
			},
			{
				description: 'null repoId',
				request: {
					userId: 'user-123',
					repoId: null as any,
					repoName: 'test-repo',
					name: 'Test Project'
				},
				expectedErrorMessage: 'Repository ID is required'
			}
		])(
			'should return validation error for $description',
			async ({ request, expectedErrorMessage }) => {
				const result = await useCase.execute(request as AddProjectRequest);

				expect(result.isFailure).toBe(true);

				const error = result.error();
				expect(error).toBeInstanceOf(ValidationError);
				expect(error.message).toContain(expectedErrorMessage);

				expect(projectRepository.findByUserId).not.toHaveBeenCalled();
				expect(projectRepository.save).not.toHaveBeenCalled();
			}
		);
	});

	describe('when repository operations fail', () => {
		it('should handle repository save failure gracefully', async () => {
			const request: AddProjectRequest = new AddProjectRequestBuilder()
				.withUserId('user-123')
				.withRepoId(456)
				.withRepoName('my-repo')
				.withName('My Project')
				.withDescription('My Project Description')
				.buildWithAllFields();

			projectRepository.findByUserId.mockResolvedValue([]);
			projectRepository.save.mockRejectedValue(new Error('Database connection failed'));

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectCreationError);

			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.save).toHaveBeenCalledTimes(1);
		});
	});
});
