import { GetProjectUseCase } from './get-project.use-case';
import { GetProjectRequest } from './get-project.types';
import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import { GetProjectRequestBuilder } from '../../../__test__/builders/get-project-request.builder';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ProjectRetrievalError } from '../../../domain/errors/project.error';

describe('GetProjectUseCase', () => {
	let useCase: GetProjectUseCase;
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

		useCase = new GetProjectUseCase(projectRepository);
	});

	describe('when getting projects for a valid user', () => {
		it('should return multiple projects for valid userId', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-123').build();

			const mockProjects = [
				new ProjectBuilder()
					.withId('project-1')
					.withUserId('user-123')
					.withRepoId(123)
					.withRepoName('My Project')
					.withName('My Project')
					.withDescription('Project description')
					.build(),
				new ProjectBuilder()
					.withId('project-2')
					.withUserId('user-123')
					.withRepoId(456)
					.withRepoName('Another Project')
					.withName('Another Project')
					.withDescription('Another description')
					.build()
			];

			projectRepository.findByUserId.mockResolvedValue(mockProjects);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const projects = result.getValue();
			expect(projects).toHaveLength(2);
			expect(projects[0].id).toBe('project-1');
			expect(projects[1].id).toBe('project-2');
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
		});

		it('should return single project for valid userId', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-456').build();

			const mockProjects = [
				new ProjectBuilder()
					.withId('project-1')
					.withUserId('user-456')
					.withRepoId(789)
					.withRepoName('Single Project')
					.withName('Single Project')
					.withDescription('Single project description')
					.build()
			];

			projectRepository.findByUserId.mockResolvedValue(mockProjects);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const projects = result.getValue();
			expect(projects).toHaveLength(1);
			expect(projects[0].id).toBe('project-1');
			expect(projects[0].name).toBe('Single Project');
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-456');
		});

		it('should return empty array when user has no projects', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-no-projects').build();

			projectRepository.findByUserId.mockResolvedValue([]);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const projects = result.getValue();
			expect(projects).toHaveLength(0);
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-no-projects');
		});

		it('should return projects excluding deleted ones', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-789').build();
			const activeProjects = [
				new ProjectBuilder()
					.withId('project-active')
					.withUserId('user-789')
					.withRepoId(111)
					.withRepoName('Active Project')
					.withName('Active Project')
					.build()
			];

			projectRepository.findByUserId.mockResolvedValue(activeProjects);

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const projects = result.getValue();
			expect(projects).toHaveLength(1);
			expect(projects[0].id).toBe('project-active');
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-789');
		});
	});

	describe('when request data is invalid', () => {
		it.each([
			{
				description: 'empty userId',
				request: { userId: '' },
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'null userId',
				request: { userId: null as any },
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'undefined userId',
				request: { userId: undefined as any },
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'whitespace only userId',
				request: { userId: '   ' },
				expectedErrorMessage: 'User ID is required'
			}
		])(
			'should return validation error for $description',
			async ({ request, expectedErrorMessage }) => {
				const result = await useCase.execute(request as GetProjectRequest);

				expect(result.isFailure).toBe(true);
				const error = result.error();
				expect(error).toBeInstanceOf(ValidationError);
				expect((error as ValidationError).message).toContain(expectedErrorMessage);
				expect(projectRepository.findByUserId).not.toHaveBeenCalled();
			}
		);
	});

	describe('when repository operations fail', () => {
		it('should handle repository findByUserId failure gracefully', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-123').build();

			projectRepository.findByUserId.mockRejectedValue(
				new Error('Database connection failed')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectRetrievalError);
			expect((error as ProjectRetrievalError).message).toContain(
				'Failed to retrieve projects'
			);
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-123');
		});

		it('should handle unexpected repository errors', async () => {
			const request = new GetProjectRequestBuilder().withUserId('user-456').build();

			projectRepository.findByUserId.mockRejectedValue(
				new Error('Unexpected database error')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			const error = result.error();
			expect(error).toBeInstanceOf(ProjectRetrievalError);
			expect((error as ProjectRetrievalError).message).toContain(
				'Failed to retrieve projects'
			);
			expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-456');
		});
	});
});
