import React from "react";

function Sidebar({ collectionPoints, selectedPoint, setSelectedPoint }) {
  return (
    <div
      style={{
        width: "300px",
        overflowY: "auto",
        borderRight: "1px solid #ccc",
        padding: "10px",
      }}
    >
      <h2>그룹 목록</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {collectionPoints.map((point) => (
          <li
            key={point.name}
            style={{
              padding: "10px",
              margin: "5px 0",
              background: selectedPoint === point ? "#f0f0f0" : "#fff",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: "5px",
            }}
            onClick={() => setSelectedPoint(point)} // 클릭 시 선택된 수거함 업데이트
          >
            {point.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
