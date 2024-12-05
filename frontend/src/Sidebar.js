import React from "react";

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <div
      style={{
        width: isOpen ? "300px" : "0",
        height: "100%",
        backgroundColor: "#f4f4f4",
        borderLeft: "1px solid #ccc",
        padding: isOpen ? "10px" : "0",
        boxSizing: "border-box",
        overflowX: "hidden",
        transition: "width 0.3s ease, padding 0.3s ease",
        position: "fixed",
        top: "0",
        right: "0",
        zIndex: "1000",
      }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "#ddd",
          border: "1px solid #ccc",
          borderRadius: "5px",
          padding: "5px 10px",
          cursor: "pointer",
          zIndex: "1001",
        }}
      >
        닫기
      </button>

      {/* 사이드바 내용 */}
      {isOpen && (
        <div style={{ marginTop: "50px" }}>
          <h2>그룹</h2>
          <p>여기에 원하는 내용을 추가하세요.</p>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
