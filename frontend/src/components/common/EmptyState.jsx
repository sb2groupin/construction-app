import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './EmptyState.module.css';

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
    <div className={styles.emptyState}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{defaultTitle}</h3>
      <p className={styles.description}>{defaultDescription}</p>
      
      {customContent && (
        <div className={styles.customContent}>
          {customContent}
        </div>
      )}

      {actionLabel && onAction && (
        <button className={`btn btn-primary ${styles.actionButton}`} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
