import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import Dialog from '@/components/dialog/Dialog';
import Button from '@/components/button/Button';
import { useApiFetchInterceptors } from '@/hooks/useApiFetchInterceptors';
import { useAuthStore } from '@/stores/authStore';
import './refresh-token.scss';

function decodeTokenExpiration(token: string): number | null {
	const [, payload] = token.split('.');

	if (!payload) {
		return null;
	}

	try {
		const normalizedPayload = payload
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		const padded = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), '=');
		const decoded = JSON.parse(window.atob(padded)) as { readonly exp?: unknown };
		return typeof decoded.exp === 'number' ? decoded.exp : null;
	} catch (error) {
		console.error('Failed to decode access token expiration', error);
		return null;
	}
}

export default function RefreshToken() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const navigate = useNavigate();
	const accessToken = useAuthStore((state) => state.accessToken);
	const logout = useAuthStore((state) => state.logout);
	const sessionExpiredDialogOpen = useAuthStore((state) => state.sessionExpiredDialogOpen);
	const setSessionExpiredDialogOpen = useAuthStore((state) => state.setSessionExpiredDialogOpen);
	const { t } = useTranslation('common', { keyPrefix: 'sessionExpired' });

	const handleSessionEnded = useCallback(() => {
		logout();
		navigate('/', { replace: true });
	}, [logout, navigate]);

	const handleActionClick = useCallback(() => {
		setIsDialogOpen(false);
		setSessionExpiredDialogOpen(false);
		handleSessionEnded();
	}, [handleSessionEnded, setSessionExpiredDialogOpen]);

	const handleOpenChange = useCallback((open: boolean) => {
		if (open) {
			setIsDialogOpen(true);
			setSessionExpiredDialogOpen(true);
			return;
		}

		setIsDialogOpen(false);
		setSessionExpiredDialogOpen(false);
		handleSessionEnded();
	}, [handleSessionEnded, setSessionExpiredDialogOpen]);

	useEffect(() => {
		setIsDialogOpen(sessionExpiredDialogOpen);
	}, [sessionExpiredDialogOpen]);

	const expirationTimerRef = useRef<number | null>(null);

	const clearExpirationTimer = useCallback(() => {
		if (expirationTimerRef.current) {
			window.clearTimeout(expirationTimerRef.current);
			expirationTimerRef.current = null;
		}
	}, []);

	useEffect(() => clearExpirationTimer, [clearExpirationTimer]);

	useEffect(() => {
		clearExpirationTimer();

		if (!accessToken) {
			return;
		}

		const expirationEpochSeconds = decodeTokenExpiration(accessToken);

		if (!expirationEpochSeconds) {
			return;
		}

		const millisecondsUntilExpiration = (expirationEpochSeconds * 1000) - Date.now();

		if (millisecondsUntilExpiration <= 0) {
			setSessionExpiredDialogOpen(true);
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setSessionExpiredDialogOpen(true);
		}, millisecondsUntilExpiration);

		expirationTimerRef.current = timeoutId;
	}, [accessToken, clearExpirationTimer, setSessionExpiredDialogOpen]);

	useApiFetchInterceptors({
		onUnauthorized: () => {
			setSessionExpiredDialogOpen(true);
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

