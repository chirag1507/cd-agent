import { Project, ProjectProps, ExaminationStatus } from '../../domain/entities/project.entity';

export class ProjectBuilder {
	private props: Partial<ProjectProps> = {};

	withId(id: string): ProjectBuilder {
		this.props.id = id;
		return this;
	}

	withUserId(userId: string): ProjectBuilder {
		this.props.userId = userId;
		return this;
	}

	withRepoId(repoId: number): ProjectBuilder {
		this.props.repoId = repoId;
		return this;
	}

	withRepoName(repoName: string): ProjectBuilder {
		this.props.repoName = repoName;
		return this;
	}

	withName(name: string): ProjectBuilder {
		this.props.name = name;
		return this;
	}

	withDescription(description: string): ProjectBuilder {
		this.props.description = description;
		return this;
	}

	withExaminationStatus(status: ExaminationStatus): ProjectBuilder {
		this.props.examinationStatus = status;
		return this;
	}

	build(): Project {
		const props: ProjectProps = {
			id: this.props.id || 'test-project-id',
			userId: this.props.userId || 'test-user-id',
			repoId: this.props.repoId || 1,
			repoName: this.props.repoName || 'test-repository',
			name: this.props.name || 'Test Project',
			description: this.props.description || 'A test project description',
			examinationStatus: this.props.examinationStatus || ExaminationStatus.PENDING,
			createdAt: this.props.createdAt || new Date(),
			updatedAt: this.props.updatedAt || new Date()
		};
		return new Project(props);
	}

	create(): Project {
		const props: ProjectProps = {
			id: this.props.id || 'test-project-id',
			userId: this.props.userId || 'test-user-id',
			repoId: this.props.repoId || 1,
			repoName: this.props.repoName || 'test-repository',
			name: this.props.name || 'Test Project',
			description: this.props.description || 'A test project description',
			examinationStatus: this.props.examinationStatus || ExaminationStatus.PENDING
		};
		return Project.create(props);
	}
}
