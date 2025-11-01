import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import Dialog from '@/components/dialog/Dialog';
import Button from '@/components/button/Button';
import { API_PATHS } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

const SESSION_EXPIRED_STATUS = 401;

function isLoginRequest(requestInfo: RequestInfo | URL): boolean {
	if (requestInfo instanceof Request) {
		return requestInfo.url.includes(API_PATHS.login);
	}

	const candidate = requestInfo instanceof URL ? requestInfo.toString() : String(requestInfo);
	return candidate.includes(API_PATHS.login);
}

export default function RefreshToken() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);
	const { t } = useTranslation('common', { keyPrefix: 'sessionExpired' });

	const handleSessionEnded = useCallback(() => {
		logout();
		navigate('/', { replace: true });
	}, [logout, navigate]);

	const handleActionClick = useCallback(() => {
		setIsDialogOpen(false);
		handleSessionEnded();
	}, [handleSessionEnded]);

	const handleOpenChange = useCallback((open: boolean) => {
		if (open) {
			setIsDialogOpen(true);
			return;
		}

		setIsDialogOpen(false);
		handleSessionEnded();
	}, [handleSessionEnded]);

	useEffect(() => {
		if (typeof globalThis.fetch !== 'function') {
			return;
		}

		const originalFetch = globalThis.fetch.bind(globalThis);

		const interceptedFetch: typeof globalThis.fetch = async (...args) => {
			const response = await originalFetch(...args);

			if (
				response.status === SESSION_EXPIRED_STATUS &&
				!isLoginRequest(args[0]) &&
				useAuthStore.getState().accessToken
			) {
				setIsDialogOpen((previous) => (previous ? previous : true));
			}

			return response;
		};

		Object.assign(interceptedFetch, originalFetch);
		globalThis.fetch = interceptedFetch;

		return () => {
			globalThis.fetch = originalFetch;
		};
	}, []);

	return (
		<Dialog
			isOpen={isDialogOpen}
			onOpenChange={handleOpenChange}
			title={t('title')}
			subtitle={t('subtitle')}
			actions={(
				<Button
					variant="solid"
					size="md"
					text={t('action')}
					onClick={handleActionClick}
				/>
			)}
		>
			<p>{t('message')}</p>
		</Dialog>
	);
}

