import { ProjectRepository } from '../../../domain/interfaces/repositories/project.repository';
import { AdmitForExaminationRequest } from './admit-for-examination.types';
import { ProjectBuilder } from '../../../__test__/builders/project.builder';
import {
	ProjectNotFoundError,
	ProjectAlreadyUnderExaminationError,
	ProjectStatusUpdateError,
	ProjectAlreadyScannedError
} from '../../../domain/errors/project.error';
import { GitProviderNotFoundError } from '../../../domain/errors/delete-git-provider.error';
import { ValidationError } from '../../../../shared/domain/errors/validation.error';
import { ExaminationStatus } from '../../../domain/entities/project.entity';
import { AdmitForExaminationUseCase } from './admit-for-examination.use-case';
import { AdmitForExaminationRequestBuilder } from '../../../__test__/builders/admit-for-examination-request.builder';
import { DomainEventBus } from '../../../../shared/domain/events/domain-event-publisher.interface';
import { GitProviderRepository } from '../../../domain/interfaces/repositories/git-provider.repository';
import { GitProviderAuthBuilder } from '../../../__test__/builders/git-provider-auth.builder';
import { GitProviderAccessToken } from '../../../../shared/domain/value-objects/git-provider-access-token';
import { GitProviderService } from '../../../domain/interfaces/services/git-provider.service';
import { GitRepositoryEmptyError } from '../../../domain/errors/git-provider.error';

describe('AdmitForExaminationUseCase', () => {
	let useCase: AdmitForExaminationUseCase;
	let projectRepository: jest.Mocked<ProjectRepository>;
	let gitProviderRepository: jest.Mocked<GitProviderRepository>;
	let mockEventBus: jest.Mocked<DomainEventBus>;
	let gitProviderService: jest.Mocked<GitProviderService>;

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

		gitProviderRepository = {
			save: jest.fn(),
			delete: jest.fn(),
			findByUserId: jest.fn()
		};

		mockEventBus = {
			publish: jest.fn(),
			publishAll: jest.fn()
		};

		gitProviderService = {
			getRepositoryDetails: jest.fn(),
			getRepositories: jest.fn()
		};

		useCase = new AdmitForExaminationUseCase(
			projectRepository,
			gitProviderRepository,
			gitProviderService,
			mockEventBus
		);
	});

	describe('when admitting a valid project for examination', () => {
		it('should successfully admit project with PENDING status for first time scan', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash-abc123'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue(null);
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBe('project-456');
			expect(project.examinationStatus).toBe(ExaminationStatus.IN_PROGRESS);

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(gitProviderService.getRepositoryDetails).toHaveBeenCalledWith(
				existingProject,
				mockGitProviderAuth.accessToken
			);
			expect(projectRepository.getCommitHashByProjectId).toHaveBeenCalledWith('project-456');
			expect(projectRepository.updateCommitHash).toHaveBeenCalledWith(
				'project-456',
				'new-commit-hash-abc123'
			);
			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
			expect(mockEventBus.publish).toHaveBeenCalledWith(
				expect.objectContaining({
					aggregateId: 'project-456',
					eventType: 'ProjectAdmittedForExamination',
					payload: expect.objectContaining({
						projectId: 'project-456',
						userId: 'user-123',
						accessToken: 'mock-access-token',
						admittedBy: 'user-123',
						newStatus: ExaminationStatus.IN_PROGRESS,
						previousStatus: ExaminationStatus.PENDING,
						repoFullName: 'user/repo',
						repoBranchName: 'main',
						repoCommitHash: 'new-commit-hash-abc123',
						repoId: '789'
					})
				})
			);
		});

		it('should successfully admit project with COMPLETED status when commit hash has changed', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.COMPLETED)
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash-abc123'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue('old-commit-hash-xyz789');
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBe('project-456');
			expect(project.examinationStatus).toBe(ExaminationStatus.IN_PROGRESS);

			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
			expect(mockEventBus.publish).toHaveBeenCalledWith(
				expect.objectContaining({
					payload: expect.objectContaining({
						newStatus: ExaminationStatus.IN_PROGRESS,
						previousStatus: ExaminationStatus.COMPLETED
					})
				})
			);
		});

		it('should successfully admit project with FAILED status', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.FAILED)
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash-abc123'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue('old-commit-hash-xyz789');
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			const { project } = result.getValue();
			expect(project).toBeDefined();
			expect(project.id).toBe('project-456');
			expect(project.examinationStatus).toBe(ExaminationStatus.IN_PROGRESS);

			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
			expect(mockEventBus.publish).toHaveBeenCalledWith(
				expect.objectContaining({
					payload: expect.objectContaining({
						newStatus: ExaminationStatus.IN_PROGRESS,
						previousStatus: ExaminationStatus.FAILED
					})
				})
			);
		});
	});

	describe('when project does not exist', () => {
		it('should return ProjectNotFoundError when project is not found', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('non-existent-project')
				.build();

			projectRepository.findById.mockResolvedValue(null);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectNotFoundError);
			expect(error.message).toContain('Project not found');

			expect(projectRepository.findById).toHaveBeenCalledWith('non-existent-project');
			expect(gitProviderRepository.findByUserId).not.toHaveBeenCalled();
			expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});
	});

	describe('when git provider authentication is not found', () => {
		it('should return GitProviderNotFoundError when git provider authentication is not found', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(null);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(GitProviderNotFoundError);

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});
	});

	describe('when project is already under examination', () => {
		it('should return ProjectAlreadyUnderExaminationError when project status is already IN_PROGRESS', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectAlreadyUnderExaminationError);
			expect(error.message).toContain('Project is already under examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).not.toHaveBeenCalled();
			expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});
	});

	describe('when git repository is empty and no commits are found', () => {
		it('should return GitRepositoryEmptyError when git repository has no commits', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'mock-access-token', isEncrypted: true })
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);

			gitProviderService.getRepositoryDetails.mockRejectedValue(
				new GitRepositoryEmptyError()
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);
			expect(result.error()).toBeInstanceOf(GitRepositoryEmptyError);

			expect(projectRepository.updateCommitHash).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
		});
	});

	describe('when commit hash has not changed', () => {
		it('should return ProjectAlreadyScannedError when project is COMPLETED and commit hash is the same', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.COMPLETED) // ✅ Must be COMPLETED
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			const sameCommitHash = 'same-commit-hash-abc123';

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: sameCommitHash
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue(sameCommitHash);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectAlreadyScannedError);

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(gitProviderService.getRepositoryDetails).toHaveBeenCalledWith(
				existingProject,
				mockGitProviderAuth.accessToken
			);
			expect(projectRepository.getCommitHashByProjectId).toHaveBeenCalledWith('project-456');
			expect(projectRepository.updateCommitHash).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});

		it('should proceed with admission when project is COMPLETED but commit hash has changed', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.COMPLETED)
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash-abc123'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue('old-commit-hash-xyz789');
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			expect(projectRepository.updateCommitHash).toHaveBeenCalledWith(
				'project-456',
				'new-commit-hash-abc123'
			);
			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
			expect(mockEventBus.publish).toHaveBeenCalled();
		});

		it('should proceed with admission when project is PENDING even with same commit hash', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING) // PENDING status
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			const sameCommitHash = 'same-commit-hash-abc123';

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: sameCommitHash
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue(sameCommitHash);
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			// Even though commit hash is the same, PENDING projects are allowed to proceed
			expect(projectRepository.updateCommitHash).toHaveBeenCalledWith(
				'project-456',
				sameCommitHash
			);
			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
		});

		it('should proceed with admission when project is FAILED even with same commit hash', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.FAILED) // FAILED status
				.build();

			const updatedProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.IN_PROGRESS)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			const sameCommitHash = 'same-commit-hash-abc123';

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: sameCommitHash
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue(sameCommitHash);
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(updatedProject);
			mockEventBus.publish.mockResolvedValue();

			const result = await useCase.execute(request);

			expect(result.isSuccess).toBe(true);
			expect(projectRepository.updateCommitHash).toHaveBeenCalledWith(
				'project-456',
				sameCommitHash
			);
			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
		});
	});

	describe('when request data is invalid', () => {
		it.each([
			{
				description: 'empty userId',
				request: {
					userId: '',
					projectId: 'project-123'
				},
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'null userId',
				request: {
					userId: null as any,
					projectId: 'project-123'
				},
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'undefined userId',
				request: {
					userId: undefined as any,
					projectId: 'project-123'
				},
				expectedErrorMessage: 'User ID is required'
			},
			{
				description: 'empty projectId',
				request: {
					userId: 'user-123',
					projectId: ''
				},
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'null projectId',
				request: {
					userId: 'user-123',
					projectId: null as any
				},
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'undefined projectId',
				request: {
					userId: 'user-123',
					projectId: undefined as any
				},
				expectedErrorMessage: 'Project ID is required'
			},
			{
				description: 'userId must be a string',
				request: {
					userId: 123 as any,
					projectId: 'project-123'
				},
				expectedErrorMessage: 'User ID must be a string'
			},
			{
				description: 'projectId must be a string',
				request: {
					userId: 'user-123',
					projectId: 123 as any
				},
				expectedErrorMessage: 'Project ID must be a string'
			}
		])(
			'should return validation error for $description',
			async ({ request, expectedErrorMessage }) => {
				const result = await useCase.execute(request as AdmitForExaminationRequest);

				expect(result.isFailure).toBe(true);

				const error = result.error();
				expect(error).toBeInstanceOf(ValidationError);
				expect(error.message).toContain(expectedErrorMessage);

				expect(projectRepository.findById).not.toHaveBeenCalled();
				expect(gitProviderRepository.findByUserId).not.toHaveBeenCalled();
				expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
				expect(mockEventBus.publish).not.toHaveBeenCalled();
				expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
			}
		);
	});

	describe('when repository operations fail', () => {
		it('should handle repository findById failure gracefully', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			projectRepository.findById.mockRejectedValue(new Error('Database connection failed'));

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).not.toHaveBeenCalled();
			expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});

		it('should handle git provider repository failure gracefully', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockRejectedValue(
				new Error('Git provider service unavailable')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(gitProviderService.getRepositoryDetails).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});

		it('should handle git repo details service failure gracefully', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockRejectedValue(
				new Error('Failed to fetch repo details')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(gitProviderService.getRepositoryDetails).toHaveBeenCalledWith(
				existingProject,
				mockGitProviderAuth.accessToken
			);
			expect(projectRepository.getCommitHashByProjectId).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
			expect(projectRepository.updateExaminationStatus).not.toHaveBeenCalled();
		});

		it('should handle getCommitHashByProjectId failure gracefully', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({
						value: 'mock-access-token',
						isEncrypted: true
					})
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash'
			});
			projectRepository.getCommitHashByProjectId.mockRejectedValue(
				new Error('Failed to get commit hash')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.getCommitHashByProjectId).toHaveBeenCalledWith('project-456');
			expect(projectRepository.updateCommitHash).not.toHaveBeenCalled();
			expect(mockEventBus.publish).not.toHaveBeenCalled();
		});

		it('should handle event bus publish failure and prevent status update', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'mock-access-token', isEncrypted: true })
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue('old-commit-hash');
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockResolvedValue(existingProject);
			mockEventBus.publish.mockRejectedValue(new Error('Event bus connection failed'));

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(mockEventBus.publish).toHaveBeenCalled();
		});

		it('should handle repository updateExaminationStatus failure gracefully', async () => {
			const request: AdmitForExaminationRequest = new AdmitForExaminationRequestBuilder()
				.withUserId('user-123')
				.withProjectId('project-456')
				.build();

			const existingProject = new ProjectBuilder()
				.withId('project-456')
				.withUserId('user-123')
				.withName('legacy-project')
				.withRepoId(789)
				.withExaminationStatus(ExaminationStatus.PENDING)
				.build();

			const mockGitProviderAuth = new GitProviderAuthBuilder()
				.withUserId('user-123')
				.withAccessToken(
					GitProviderAccessToken.create({ value: 'mock-access-token', isEncrypted: true })
				)
				.withGitProvider('GITHUB')
				.build();

			projectRepository.findById.mockResolvedValue(existingProject);
			gitProviderRepository.findByUserId.mockResolvedValue(mockGitProviderAuth);
			gitProviderService.getRepositoryDetails.mockResolvedValue({
				repoFullName: 'user/repo',
				repoBranch: 'main',
				repoCommitHash: 'new-commit-hash'
			});
			projectRepository.getCommitHashByProjectId.mockResolvedValue('old-commit-hash');
			projectRepository.updateCommitHash.mockResolvedValue();
			projectRepository.updateExaminationStatus.mockRejectedValue(
				new Error('Database update failed')
			);

			const result = await useCase.execute(request);

			expect(result.isFailure).toBe(true);

			const error = result.error();
			expect(error).toBeInstanceOf(ProjectStatusUpdateError);
			expect(error.message).toContain('Failed to admit project for examination');

			expect(projectRepository.findById).toHaveBeenCalledWith('project-456');
			expect(gitProviderRepository.findByUserId).toHaveBeenCalledWith('user-123');
			expect(projectRepository.updateExaminationStatus).toHaveBeenCalledWith(
				'project-456',
				ExaminationStatus.IN_PROGRESS
			);
		});
	});
});
