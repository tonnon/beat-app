import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthDialog } from '@/context/auth/useAuthDialog';
import { useAuthDialogFlowStore } from '@/stores/authDialogFlowStore';

const extractQueryParams = (search: string) => {
  const params = new URLSearchParams(search);
  const email = params.get('email');
  const code = params.get('token') ?? params.get('code');

  if (!email || !code) {
    return null;
  }

  return {
    email: email.trim(),
    code: code.trim(),
  };
};

export default function ConfirmEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openDialog } = useAuthDialog();
  const setConfirmEmailFlow = useAuthDialogFlowStore((state) => state.setConfirmEmailFlow);

  useEffect(() => {
    const params = extractQueryParams(location.search);

    if (!params) {
      navigate('/', { replace: true });
      return;
    }

    setConfirmEmailFlow({ ...params, autoConfirm: true });
    openDialog();
  }, [location.search, navigate, openDialog, setConfirmEmailFlow]);

  return null;
}
