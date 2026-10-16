import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../api/api-error';
import {
  createUser,
  deleteUser,
  getUsers,
  searchUsers,
  updateUser,
} from '../api/users';
import { useAuth } from '../auth/use-auth';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import DataTable, { type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import type {
  CreateUserData,
  UpdateUserData,
  User,
  UserRole,
} from '../types/user';
import './UsersPage.css';

type UserForm = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
};

const emptyForm: UserForm = {
  username: '',
  email: '',
  password: '',
  role: 'User',
  active: true,
};

export default function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] =
    useState<User | null>(null);
  const [form, setForm] =
    useState<UserForm>(emptyForm);

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getUsers();
      setUsers(data);
      setAllUsers(data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t('users.loadError'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const hasActiveFilters =
    usernameFilter.trim() !== '' ||
    emailFilter.trim() !== '' ||
    roleFilter.trim() !== '' ||
    activeFilter !== '';

  async function handleSearch() {
    try {
      setIsSearching(true);
      setError('');

      const data = await searchUsers({
        username:
          usernameFilter.trim() || undefined,
        email:
          emailFilter.trim() || undefined,
        role:
          roleFilter.trim() || undefined,
        active:
          activeFilter === ''
            ? undefined
            : activeFilter === 'true',
      });

      setUsers(data);
      setHasSearched(true);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t('users.loadError'),
        ),
      );
    } finally {
      setIsSearching(false);
    }
  }

  function clearFilters() {
    setUsernameFilter('');
    setEmailFilter('');
    setRoleFilter('');
    setActiveFilter('');
    setHasSearched(false);
    setUsers(allUsers);
    setError('');
  }

  const roleOptions = useMemo(
    () => [
      {
        value: 'User',
        label: t('common.roles.user'),
      },
      {
        value: 'Administrator',
        label: t('common.roles.administrator'),
      },
    ],
    [t],
  );

  const activeOptions = useMemo(
    () => [
      {
        value: 'true',
        label: t('users.active'),
      },
      {
        value: 'false',
        label: t('users.inactive'),
      },
    ],
    [t],
  );

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(selectedUser: User) {
    setEditingUser(selectedUser);
    setForm({
      username: selectedUser.username,
      email: selectedUser.email,
      password: '',
      role: selectedUser.role.name,
      active: selectedUser.active,
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingUser(null);
    setFormError('');
  }

  function updateField<K extends keyof UserForm>(
    field: K,
    value: UserForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.username.trim()) {
      return t('users.validation.usernameRequired');
    }

    if (!form.email.trim()) {
      return t('users.validation.emailRequired');
    }

    if (!editingUser && !form.password.trim()) {
      return t('users.validation.passwordRequired');
    }

    if (
      form.password &&
      form.password.length < 6
    ) {
      return t('users.validation.passwordLength');
    }

    return '';
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingUser) {
        const data: UpdateUserData = {
          username: form.username.trim(),
          email: form.email.trim(),
          role: form.role,
          active: form.active,
        };

        if (form.password.trim()) {
          data.password = form.password;
        }

        const updated = await updateUser(
          editingUser.user_id,
          data,
        );

        setUsers((current) =>
          current.map((item) =>
            item.user_id === updated.user_id
              ? updated
              : item,
          ),
        );
      } else {
        const data: CreateUserData = {
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        };

        const created = await createUser(data);

        setUsers((current) => [
          ...current,
          created,
        ]);
      }

      setModalOpen(false);
      setEditingUser(null);
    } catch (requestError) {
      setFormError(
        getApiErrorMessage(
          requestError,
          editingUser
            ? t('users.saveError')
            : t('users.createError'),
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!userToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await deleteUser(userToDelete.user_id);

      setUsers((current) =>
        current.filter(
          (item) =>
            item.user_id !==
            userToDelete.user_id,
        ),
      );

      setUserToDelete(null);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t('users.deleteError'),
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'username',
      header: t('users.username'),
      render: (item: User) => (
        <strong>{item.username}</strong>
      ),
    },
    {
      key: 'email',
      header: t('users.email'),
      render: (item: User) => item.email,
    },
    {
      key: 'role',
      header: t('users.role'),
      render: (item: User) =>
        item.role.name === 'Administrator'
          ? t('common.roles.administrator')
          : t('common.roles.user'),
    },
    {
      key: 'status',
      header: t('users.status'),
      render: (item: User) => (
        <span
          className={`users-status ${
            item.active
              ? 'users-status-active'
              : 'users-status-inactive'
          }`}
        >
          {item.active
            ? t('users.active')
            : t('users.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('users.actions'),
      render: (item: User) => (
        <div className="users-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              openEditModal(item)
            }
          >
            {t('common.edit')}
          </Button>

          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              setUserToDelete(item)
            }
            disabled={
              item.user_id ===
              currentUser?.user_id
            }
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <PageHeader
        eyebrow={t('users.eyebrow')}
        title={t('users.title')}
        description={t('users.description')}
        actions={
          <Button
            type="button"
            onClick={openCreateModal}
          >
            {t('users.newUser')}
          </Button>
        }
      />

      <div className="users-toolbar">
        <div className="users-filters">
          <Input
            label={t('users.filters.username')}
            placeholder={t(
              'users.filters.usernamePlaceholder',
            )}
            value={usernameFilter}
            onChange={(event) =>
              setUsernameFilter(event.target.value)
            }
          />

          <Input
            label={t('users.filters.email')}
            placeholder={t(
              'users.filters.emailPlaceholder',
            )}
            value={emailFilter}
            onChange={(event) =>
              setEmailFilter(event.target.value)
            }
          />

          <Input
            label={t('users.filters.role')}
            placeholder={t(
              'users.filters.rolePlaceholder',
            )}
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          />

          <Select
            label={t('users.filters.status')}
            value={activeFilter}
            onChange={(event) =>
              setActiveFilter(event.target.value)
            }
            options={[
              {
                value: '',
                label: t('users.filters.allStatuses'),
              },
              ...activeOptions,
            ]}
          />
        </div>

        <div className="users-toolbar-footer">
          <Button
            type="button"
            onClick={() => void handleSearch()}
            disabled={isSearching}
          >
            {isSearching
              ? t('common.loading')
              : t('users.search')}
          </Button>

          <span className="users-count">
            {users.length}
          </span>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="secondary"
              onClick={clearFilters}
              disabled={isSearching}
            >
              {t('users.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} />
      )}

      {loading ? (
        <LoadingState
          message={t('users.loading')}
        />
      ) : users.length === 0 ? (
        <EmptyState
          title={
            hasSearched
              ? t('users.noResults')
              : t('users.emptyTitle')
          }
          description={
            hasSearched
              ? t('users.noResultsDescription')
              : t('users.emptyDescription')
          }
          action={
            !hasSearched ? (
              <Button
                type="button"
                onClick={openCreateModal}
              >
                {t('users.newUser')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          getRowKey={(item) => item.user_id}
        />
      )}

      <Modal
        open={modalOpen}
        title={
          editingUser
            ? t('users.editTitle')
            : t('users.createTitle')
        }
        onClose={closeModal}
      >
        <form
          className="users-form"
          onSubmit={handleSubmit}
        >
          {formError && (
            <ErrorMessage
              message={formError}
            />
          )}

          <Input
            label={t('users.username')}
            value={form.username}
            onChange={(event) =>
              updateField(
                'username',
                event.target.value,
              )
            }
            disabled={saving}
            autoFocus
            autoComplete="off"
          />

          <Input
            label={t('users.email')}
            type="email"
            value={form.email}
            onChange={(event) =>
              updateField(
                'email',
                event.target.value,
              )
            }
            disabled={saving}
            autoComplete="off"
          />

          <Input
            label={
              editingUser
                ? t('users.newPassword')
                : t('users.password')
            }
            type="password"
            value={form.password}
            onChange={(event) =>
              updateField(
                'password',
                event.target.value,
              )
            }
            disabled={saving}
            autoComplete="new-password"
          />

          <Select
            label={t('users.role')}
            value={form.role}
            onChange={(event) =>
              updateField(
                'role',
                event.target.value as UserRole,
              )
            }
            options={roleOptions}
            disabled={saving}
          />

          {editingUser && (
            <Select
              label={t('users.status')}
              value={String(form.active)}
              onChange={(event) =>
                updateField(
                  'active',
                  event.target.value === 'true',
                )
              }
              options={activeOptions}
              disabled={
                saving ||
                editingUser.user_id ===
                  currentUser?.user_id
              }
            />
          )}

          <div className="users-form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>

            <Button
              type="submit"
              loading={saving}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(userToDelete)}
        title={t('users.deleteTitle')}
        description={
          userToDelete
            ? t('users.deleteDescription', {
                username:
                  userToDelete.username,
              })
            : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) {
            setUserToDelete(null);
          }
        }}
        loading={deleting}
      />
    </div>
  );
}
