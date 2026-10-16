import {
  MapPin,
  Pencil,
  Shield,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Team } from '../../types/team';
import { Badge } from './Badge';
import { Card } from './Card';
import { IconButton } from './IconButton';
import './TeamCard.css';


type TeamCardProps = {
  team: Team;
  canEdit?: boolean;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
};

export function TeamCard({
  team,
  canEdit = false,
  onEdit,
  onDelete,
}: TeamCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="team-card">
      <div className="team-card-header">
        <div className="team-card-icon" aria-hidden="true">
          <Shield
            size={22}
            strokeWidth={1.9}
          />
        </div>

        <div className="team-card-actions">
          <Badge variant="neutral">
            {team.color}
          </Badge>

          {canEdit && onEdit && (
            <IconButton
              label={t('teams.edit')}
              onClick={() => onEdit(team)}
            >
              <Pencil
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </IconButton>
          )}

          {canEdit && onDelete && (
            <IconButton
                label={t('teams.delete')}
                variant="danger"
                onClick={() => onDelete(team)}
            >
                <Trash2
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
                />
            </IconButton>
            )}
        </div>
      </div>

      <div className="team-card-content">
        <h2>{team.name}</h2>

        <span className="team-card-province">
          <MapPin
            size={14}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          {team.province}
        </span>
      </div>

      <div className="team-card-stats">
        <div>
          <span>{t('teams.participated')}</span>
          <strong>
            {team.championships_participated}
          </strong>
        </div>

        <div>
          <span>{t('teams.won')}</span>
          <strong>
            {team.championships_won}
          </strong>
        </div>

        <div>
          <span>{t('teams.mascot')}</span>
          <strong>{team.mascot}</strong>
        </div>
      </div>
    </Card>
  );
}