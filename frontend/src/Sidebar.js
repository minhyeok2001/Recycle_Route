import React, { useState, useEffect} from "react";
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eaeaea;
`;

function Sidebar({ isOpen, toggleSidebar, groups, toggleGroupMarkers, uid, map }) {
  const [isAddingGroup, setIsAddingGroup] = useState(false); // 그룹 추가 모드 상태
  const [selectedRegion, setSelectedRegion] = useState(""); // 선택된 지역
  const [groupName, setGroupName] = useState(""); // 새 그룹 이름
  const [markers, setMarkers] = useState([]); // 현재 보여지는 마커
  const [selectedMarkers, setSelectedMarkers] = useState([]); // 그룹에 추가할 마커
  const [regions, setRegions] = useState([]); // 서버에서 받아온 지역 목록

  useEffect(() => {
    // 지역 목록을 서버에서 가져오기
    const fetchRegions = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/api/districts");
        const data = await response.json();
        setRegions(data.districts); // 서버에서 받아온 지역 목록 설정
      } catch (error) {
        console.error("Failed to fetch regions:", error);
      }
    };

    fetchRegions();
  }, []);
  const startAddingGroup = () => {
    setIsAddingGroup(true);
    setSelectedRegion("");
    setGroupName("");
    setSelectedMarkers([]);
  };

  const stopAddingGroup = () => {
    setIsAddingGroup(false);
    setSelectedRegion("");
    setGroupName("");
    setSelectedMarkers([]);
    markers.forEach((marker) => marker.setMap(null)); // 지도에서 마커 제거
  };

  
  const fetchMarkersByRegion = async (region) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/add_markers/${region}`);
      const data = await response.json();
  
      if (!data.markers || !Array.isArray(data.markers)) {
        console.error("Invalid data format or markers missing:", data);
        return; // 데이터가 없을 경우 함수 종료
      }
  
      // 기존 마커 제거
      markers.forEach((marker) => marker.setMap(null));
  
      // 새로운 마커 표시
      const newMarkers = data.markers.map((marker) => {
        const naverMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(marker.latitude, marker.longitude),
          map,
          title: `CID: ${marker.cid}`,
        });
  
        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(naverMarker, "click", () => {
          handleMarkerClick(marker.cid, naverMarker);
        });
  
        return naverMarker;
      });
  
      setMarkers(newMarkers);
    } catch (error) {
      console.error("Failed to fetch markers:", error);
    }
  };

  

  const saveGroup = async () => {
    if (!groupName || selectedMarkers.length === 0) {
      alert("그룹 이름과 선택된 마커를 확인해주세요!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5001/api/add_markers/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_name: groupName,
          cid_list: selectedMarkers.map((marker) => marker.cid),
          uid,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("그룹이 성공적으로 저장되었습니다!");
        stopAddingGroup();
      }
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleMarkerClick = (cid, naverMarker) => {
    setSelectedMarkers((prev) => {
      const alreadySelected = prev.some((marker) => marker.cid === cid);
      if (alreadySelected) {
        naverMarker.setIcon(null); // 선택 해제 시 기본 아이콘으로 변경
        return prev.filter((marker) => marker.cid !== cid);
      } else {
        naverMarker.setIcon({
          content: `<div style="width:20px; height:20px; background-color:#ff3333; border-radius:50%;"></div>`,
        });
        return [...prev, { cid }];
      }
    });
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
              <span>{group.name}</span>
              <ToggleContainer onClick={() => toggleGroupMarkers(group.group_id)}>
                <div
                  className={`toggle-container ${
                    group.active ? "toggle--checked" : ""
                  }`}
                />
                <div
                  className={`toggle-circle ${
                    group.active ? "circle--checked" : ""
                  }`}
                />
              </ToggleContainer>
            </GroupItem>
          ))
        ) : (
          <p>등록된 그룹이 없습니다.</p>
        )}
      </div>

      {/* 그룹 추가 섹션 */}
      <div className={styles.sidebar}>
        {isAddingGroup ? (
          <>
            <h3>그룹 추가</h3>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                fetchMarkersByRegion(e.target.value);
              }}
            >
              <option value="">지역 선택</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="그룹 이름"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button onClick={saveGroup}>저장</button>
            <button onClick={stopAddingGroup}>취소</button>
          </>
        ) : (
          <button onClick={startAddingGroup}>그룹 추가</button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;