import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import Dialog from '@/components/dialog/Dialog';
import Button from '@/components/button/Button';
import { useApiFetchInterceptors } from '@/hooks/useApiFetchInterceptors';
import { useAuthStore } from '@/stores/authStore';
import './refresh-token.scss';

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

	useApiFetchInterceptors({
		onUnauthorized: () => {
			setIsDialogOpen((previous) => (previous ? previous : true));
		},
	});

	return (
		<Dialog
			isOpen={isDialogOpen}
			onOpenChange={handleOpenChange}
			title={t('title')}
			subtitle={t('subtitle')}
			actions={(
				<div className="session-expired-dialog__actions">
					<Button
						variant="solid"
						size="md"
						text={t('action')}
						onClick={handleActionClick}
					/>
				</div>
			)}
		>
			<div className="session-expired-dialog__content">
				<p className="session-expired-dialog__message">{t('message')}</p>
			</div>
		</Dialog>
	);
}

