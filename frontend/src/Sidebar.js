import React, { useState, useEffect } from "react";
import styled from "styled-components";
import styles from "./sidebar.module.css";
import RollupSummary from "./RollupSummary";

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

function Sidebar({
  isOpen,
  toggleSidebar,
  groups,
  toggleGroupMarkers,
  uid,
  map,
  activeGroup, // 활성화된 그룹
  setActiveGroup, // 활성화된 그룹 업데이트
  groupMarkers,
  setGroupMarkers,
  fetchGroups,
  collectionPoints,
  setCollectionPoints
}) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [groupName, setGroupName] = useState("");
  const [markers, setMarkers] = useState([]);
  const [selectedMarkers, setSelectedMarkers] = useState([]);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    // 지역 목록을 서버에서 가져오기
    const fetchRegions = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/api/districts");
        const data = await response.json();
        setRegions(data.districts);
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
    fetchGroups(); // 그룹 목록 재갱신
  };

  const stopAddingGroup = () => {
    setIsAddingGroup(false);
    setSelectedRegion("");
    setGroupName("");
    setSelectedMarkers([]);
    markers.forEach((marker) => marker.setMap(null)); // 지도에서 마커 제거
    fetchGroups(); // 그룹 목록 재갱신
  };

  const fetchMarkersByRegion = async (region) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/add_markers/${region}`);
      const data = await response.json();

      if (!data.markers || !Array.isArray(data.markers)) {
        console.error("Invalid data format or markers missing:", data);
        return;
      }

      markers.forEach((marker) => marker.setMap(null));

      const newMarkers = data.markers.map((marker) => {
        const naverMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(marker.latitude, marker.longitude),
          map,
          title: `CID: ${marker.cid}`,
          icon: {
            content: `<div style="width: 10px; height: 10px; background-color:#FF8C00; border-radius: 50%;"></div>`,
          },
        });

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
          uid : uid,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert("그룹이 성공적으로 저장되었습니다!");
        fetchGroups(); // 그룹 목록 업데이트
        stopAddingGroup(); // 그룹 추가 모드 종료
      }
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleMarkerClick = (cid, naverMarker) => {
    setSelectedMarkers((prev) => {
      const alreadySelected = prev.some((marker) => marker.cid === cid);
      if (alreadySelected) {
        naverMarker.setIcon({
          content: `<div style="width: 10px; height: 10px; background-color:#FF8C00; border-radius: 50%;"></div>`,
        });
        return prev.filter((marker) => marker.cid !== cid);
      } else {
        naverMarker.setIcon({
          content: `<div style="width:20px; height:20px; background-color:#ff3333; border-radius:50%;"></div>`,
        });
        return [...prev, { cid }];
      }
    });
  };

  const deleteGroup = async (group_id) => {
    const confirmDelete = window.confirm("정말로 이 그룹을 삭제하시겠습니까?");
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/delete_group/${group_id}`, {
        method: "DELETE",
      });
  
      const data = await response.json();
      if (data.success) {
        alert("그룹이 성공적으로 삭제되었습니다!");
  
        // 지도에서 해당 그룹의 마커를 제거
        if (activeGroup === group_id) {
          groupMarkers.forEach((marker) => marker.setMap(null)); // 지도에서 마커 제거
          setGroupMarkers([]); // 상태 초기화
          setActiveGroup(null); // 활성화된 그룹 해제
        }

      // `collectionPoints` 업데이트: 삭제된 그룹과 관련된 마커 제거
      setCollectionPoints((prevPoints) =>
        prevPoints.filter((point) => point.group_id !== group_id)
      );
  
        await fetchGroups(); // 그룹 목록을 갱신
      } else {
        alert("그룹 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("서버 오류로 인해 그룹 삭제에 실패했습니다.");
    }
  };


  return (
    <div className={isOpen ? styles.openpage : styles.closepage}>
      <button onClick={toggleSidebar} className={styles.button}>
        닫기
      </button>
      <div className={styles.group}>
        <h2>그룹</h2>
        {groups.length > 0 ? (
          groups.map((group) => (
            <GroupItem key={group.group_id}>
              <span>{group.name}</span>
              <ToggleContainer
                onClick={() => {
                  setActiveGroup(group.group_id); // 활성화된 그룹 설정
                  toggleGroupMarkers(group.group_id);
                }}
              >
                <div
                  className={`toggle-container ${
                    activeGroup === group.group_id ? "toggle--checked" : ""
                  }`}
                />
                <div
                  className={`toggle-circle ${
                    activeGroup === group.group_id ? "circle--checked" : ""
                  }`}
                />
              </ToggleContainer>
              <button
                onClick={() => deleteGroup(group.group_id)}
                style={{
                  marginLeft: "10px",
                  padding: "5px 10px",
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                삭제
              </button>
            </GroupItem>
          ))
        ) : (
          <p>등록된 그룹이 없습니다.</p>
        )}
      </div>

      <div className={styles.sidebar}>
        {isAddingGroup ? (
          <>
            <h3>그룹 추가</h3>
            <div className="select-container">
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
            </div>
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

      <RollupSummary />
    </div>
  );
}

export default Sidebar;