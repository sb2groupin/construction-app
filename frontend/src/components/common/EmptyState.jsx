import React from 'react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ 
  icon = '📭',
  title = null,
  description = null,
  actionLabel = null,
  onAction = null,
  customContent = null 
}) => {
  const { t } = useTranslation();

  const defaultTitle = title || t('noDataFound') || 'No data found';
  const defaultDescription = description || t('noDataDescription') || 'Try adjusting your filters or come back later.';

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{defaultTitle}</h3>
      <p className="empty-state-description">{defaultDescription}</p>
      
      {customContent && (
        <div className="empty-state-custom">
          {customContent}
        </div>
      )}

      {actionLabel && onAction && (
        <button className="btn btn-primary empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
