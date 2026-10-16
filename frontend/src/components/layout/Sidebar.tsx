import {
  Camera,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { resolveAssetUrl } from '../../api/client';
import { useAuth } from '../../auth/use-auth';
import { SidebarAction } from './SidebarAction';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';
import {
  getCompetitionNavigation,
  getReportsNavigation,
} from './sidebar-navigation';
import './Sidebar.css';

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_ACCEPTED_TYPES = /^image\/(jpeg|png|webp)$/;

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { t } = useTranslation();
  const { user, logout, updatePhoto, removePhoto } =
    useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<
    string | null
  >(null);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const isAdministrator =
    user?.role === 'Administrator';

  const competitionNavigation =
    getCompetitionNavigation(t);

  const reportsNavigation =
    getReportsNavigation(t);

  function getRoleLabel(role?: string) {
    if (role === 'Administrator') {
      return t('common.roles.administrator');
    }

    if (role === 'User') {
      return t('common.roles.user');
    }

    return role ?? '';
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function handlePhotoClick() {
    setPhotoError(null);
    fileInputRef.current?.click();
  }

  async function handlePhotoSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    // Permite volver a elegir el mismo archivo.
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!AVATAR_ACCEPTED_TYPES.test(file.type)) {
      setPhotoError(t('profile.invalidType'));
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setPhotoError(t('profile.tooLarge'));
      return;
    }

    setIsPhotoBusy(true);

    try {
      await updatePhoto(file);
      setPhotoError(null);
    } catch {
      setPhotoError(t('profile.uploadError'));
    } finally {
      setIsPhotoBusy(false);
    }
  }

  async function handleRemovePhoto() {
    setIsPhotoBusy(true);

    try {
      await removePhoto();
      setPhotoError(null);
    } catch {
      setPhotoError(t('profile.uploadError'));
    } finally {
      setIsPhotoBusy(false);
    }
  }

  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <div className="app-brand-mark">BNS</div>

        <span className="app-brand-full-name">
          Baseball National
          <br />
          Series
        </span>
      </div>

      <nav
        className="app-navigation"
        aria-label="Navegación principal"
      >
        <SidebarSection
          title={t('navigation.competition')}
          defaultOpen
        >
          {competitionNavigation.map((item) => (
            <SidebarItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        <SidebarSection
          title={t('navigation.reports')}
          defaultOpen={false}
        >
          {reportsNavigation.map((item) => (
            <SidebarItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>

        {isAdministrator && (
          <SidebarSection
            title={t('navigation.administration')}
            defaultOpen={false}
          >
            <SidebarItem
              label={t('navigation.users')}
              path="/users"
              icon={Users}
              onNavigate={onNavigate}
            />
          </SidebarSection>
        )}
      </nav>

      <div className="app-sidebar-bottom">
        <div className="app-user">
          <div className="app-user-avatar-wrapper">
            <button
              type="button"
              className="app-user-avatar"
              onClick={handlePhotoClick}
              aria-label={t('profile.changePhoto')}
              title={t('profile.changePhoto')}
              disabled={isPhotoBusy}
            >
              {user?.photo_url ? (
                <img
                  className="app-user-avatar-image"
                  src={resolveAssetUrl(user.photo_url)}
                  alt={user.username}
                />
              ) : (
                user?.username
                  .charAt(0)
                  .toUpperCase()
              )}

              <span
                className="app-user-avatar-overlay"
                aria-hidden="true"
              >
                <Camera size={14} strokeWidth={2} />
              </span>
            </button>

            {user?.photo_url && (
              <button
                type="button"
                className="app-user-avatar-remove"
                onClick={handleRemovePhoto}
                aria-label={t('profile.removePhoto')}
                title={t('profile.removePhoto')}
                disabled={isPhotoBusy}
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handlePhotoSelected}
            />
          </div>

          <div className="app-user-info">
            <strong>{user?.username}</strong>
            <span>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>

        {photoError && (
          <p
            className="app-user-photo-error"
            role="alert"
          >
            {photoError}
          </p>
        )}

        <SidebarAction
          label={t('navigation.logout')}
          icon={LogOut}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}
