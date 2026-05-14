import styles from "./Loader.module.css";

const Loader = ({ fullPage = true }) => {
  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.spinner} />
      </div>
    );
  }
  return (
    <div className={styles.loaderWrap}>
      <div className={styles.spinner} />
    </div>
  );
};

export default Loader;
