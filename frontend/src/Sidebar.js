import React from "react";
import styles from "./sidebar.module.css";

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div
      className={isOpen ? styles.openpage : styles.closepage}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={toggleSidebar}
        className={styles.button}
      >
        닫기
      </button>

      {/* 사이드바 내용 */}
      {isOpen && (
        <div className={styles.group}>
          <h2>그룹</h2>
          <p>여기에 원하는 내용을 추가하세요.</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
