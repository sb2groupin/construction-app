import styles from "./Modal.module.css";

const Modal = ({ title, onClose, children, footer }) => (
  <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={styles.modal}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          {"\u00D7"}
        </button>
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  </div>
);

export default Modal;
