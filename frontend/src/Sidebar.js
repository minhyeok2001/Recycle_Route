import React from "react";
import styled from "styled-components";
import styles from "./sidebar.module.css";

// Styled Components for Toggle
const ToggleContainer = styled.div`
  position: relative;
  margin-left: 1rem;
  cursor: pointer;
  display: inline-block;

  > .toggle-container {
    width: 50px;
    height: 24px;
    border-radius: 30px;
    background-color: rgb(233, 233, 234);
  }

  > .toggle--checked {
    background-color: rgb(0, 200, 102);
    transition: 0.5s;
  }

  > .toggle-circle {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: rgb(255, 254, 255);
    transition: 0.5s;
  }

  > .circle--checked {
    left: 27px;
    transition: 0.5s;
  }
`;

// 그룹 항목 스타일 추가
const GroupItem = styled.div`
  display: flex;
  justify-content: space-between; /* 그룹 이름과 버튼 간격 설정 */
  align-items: center;
  margin-bottom: 1rem; /* 각 그룹 간 간격 추가 */
  padding: 0.5rem 0; /* 버튼 영역 내부 여백 */
  border-bottom: 1px solid #eaeaea; /* 시각적 구분선 */
`;

function Sidebar({ isOpen, toggleSidebar, groups, toggleGroupMarkers }) {
  const [activeGroups, setActiveGroups] = React.useState({}); // State to track toggled groups

  // Toggle handler for individual groups
  const toggleHandler = (group_id) => {
    setActiveGroups((prev) => ({
      ...prev,
      [group_id]: !prev[group_id],
    }));

    // Call toggleGroupMarkers with the group_id
    toggleGroupMarkers(group_id);
  };

  return (
    <div className={isOpen ? styles.openpage : styles.closepage}>
      {/* 닫기 버튼 */}
      <button onClick={toggleSidebar} className={styles.button}>
        닫기
      </button>

      {/* 그룹 목록 표시 */}
      <div className={styles.group}>
        <h2>그룹</h2>
        {groups.length > 0 ? (
          groups.map((group) => (
            <GroupItem key={group.group_id}>
              {/* 그룹 이름 */}
              <span>{group.name}</span>
              {/* Styled Toggle Button */}
              <ToggleContainer onClick={() => toggleHandler(group.group_id)}>
                <div
                  className={`toggle-container ${
                    activeGroups[group.group_id] ? "toggle--checked" : ""
                  }`}
                />
                <div
                  className={`toggle-circle ${
                    activeGroups[group.group_id] ? "circle--checked" : ""
                  }`}
                />
              </ToggleContainer>
            </GroupItem>
          ))
        ) : (
          <p>등록된 그룹이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;