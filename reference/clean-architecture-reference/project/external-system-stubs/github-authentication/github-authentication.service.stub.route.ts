import { GithubAuthenticationServiceStub } from './github-authentication.service.stub';
import { Router, Request, Response } from 'express';

const routes = Router();

routes.post('/connect-git-provider-auth-service', (req: Request, res: Response) => {
	const { state } = req.body;
	GithubAuthenticationServiceStub.setAuthenticateState(state);
	res.send();
});
routes.post('/connect-git-provider-url-service', (req: Request, res: Response) => {
	const { state } = req.body;
	GithubAuthenticationServiceStub.setUrlState(state);
	res.send();
});

export default routes;
