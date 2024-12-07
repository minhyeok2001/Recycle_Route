import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import styles from "./map2.module.css";

function Map({ uid }) {
  const [currentPosition, setCurrentPosition] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 위치 (서울)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 상태
  const [groups, setGroups] = useState([]); // 그룹 목록
  const [groupMarkers, setGroupMarkers] = useState([]); // 현재 활성화된 그룹의 마커
  const [collectionPoints, setCollectionPoints] = useState([]); // 의류 수거함 데이터
  const [activeGroup, setActiveGroup] = useState(null); // 현재 활성화된 그룹 ID
  const map = useRef(null);

  useEffect(() => {
    // 네이버 지도 초기화
    const mapDiv = document.getElementById("map");
    if (window.naver && window.naver.maps) {
      map.current = new window.naver.maps.Map(mapDiv, {
        center: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
        zoom: 14,
      });
    } else {
      console.error("Naver Maps script is not loaded");
    }
  }, []);

  useEffect(() => {
    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("위치 정보를 가져올 수 없습니다:", error);
        }
      );
    } else {
      console.error("Geolocation API를 지원하지 않는 브라우저입니다.");
    }
  }, []);

  useEffect(() => {
    // 현재 위치 지도에 마킹
    if (map.current) {
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
        map: map.current,
      });
    }
  }, [currentPosition]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5001/api/home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid }),
      });
      const data = await response.json();
      setGroups(data.groups); // 최신 그룹 목록 업데이트
      setCollectionPoints(data.group_markers); // 의류 수거함 데이터 설정
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };
  
  useEffect(() => {
    if (uid) {
      fetchGroups();
    }
  }, [uid]);

  
  
  useEffect(() => {
    if (!map.current) return;
  
    console.log("CollectionPoints 업데이트:", collectionPoints);
  
    // 기존 마커와 새로운 마커 비교
    const updatedMarkers = collectionPoints.map((point) => {
      // 동일 CID 마커가 이미 있는지 확인
      const existingMarker = groupMarkers.find(
        (marker) => marker.getTitle() === `ID: ${point.cid}`
      );
  
      if (existingMarker) {
        console.log(`기존 마커 유지: CID ${point.cid}`);
        return existingMarker; // 기존 마커 유지
      } else {
        console.log(`새로운 마커 생성: CID ${point.cid}`);
        // 새로운 마커 생성
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(point.latitude, point.longitude),
          map: map.current,
          title: `ID: ${point.cid}`,
        });
  
        const infoWindow = new window.naver.maps.InfoWindow();
  
        let mapClickListener = null;
        // 마커 클릭 이벤트 추가
        window.naver.maps.Event.addListener(marker, "click", async () => {
          try {
            console.log(`Fetching marker info for CID: ${point.cid}`);
            const response = await fetch(`http://127.0.0.1:5001/api/marker/${point.cid}`);
            if (!response.ok) throw new Error(`Error: ${response.status}`);
  
            const data = await response.json();
            console.log(`Marker info for CID ${point.cid}:`, data);
  
            const content = `
            <div style="padding:10px;">
              <strong>ID:</strong> ${point.cid}<br/>
              ${data.marker_info 
                ? `<strong>Last Record Date:</strong> ${data.marker_info.date}<br/>
                   <strong>Amount:</strong> ${data.marker_info.amount}<br/>`
                : `<strong>Last Record Date:</strong> 없음<br/>
                   <strong>Amount:</strong> 없음<br/>`}
              <button id="edit-button-${point.cid}" style="margin-top:10px;">ADD RECORD</button>
            </div>`;
            infoWindow.setContent(content);
            infoWindow.open(map.current, marker);


            if (mapClickListener) {
              // 기존 리스너 제거
              window.naver.maps.Event.removeListener(mapClickListener);
            }
        
            // 새로운 리스너 추가
            mapClickListener = window.naver.maps.Event.addListener(map.current, "click", () => {
              infoWindow.close();
              if (mapClickListener) {
                window.naver.maps.Event.removeListener(mapClickListener);
                mapClickListener = null; // 리스너 초기화
              }
            });
            // Edit 버튼 클릭 이벤트 추가

            setTimeout(() => {
              const editButton = document.getElementById(`edit-button-${point.cid}`);
              if (editButton) {
                editButton.addEventListener("click", () => handleEditClick(point.cid));
              }
            }, 0);
          } catch (error) {
            console.error("Failed to fetch marker info:", error);
          }
        });
  
        return marker;
      }
    });
  
    // 업데이트된 마커만 설정
    setGroupMarkers(updatedMarkers);
  }, [collectionPoints]);

  const handleEditClick = (cid) => {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    const newAmount = prompt("Enter new amount:");
    if (newDate && newAmount) {
      fetch(`http://127.0.0.1:5001/api/marker/${cid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: newDate, amount: newAmount }),
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Error: ${response.status}`);
          return response.json();
        })
        .then(() => alert("Record updated successfully!"))
        .catch(() => alert("Failed to update record."));
    } else {
      alert("Invalid input. Update cancelled.");
    }
  };

  const attachMarkerClickHandler = (marker, point) => {
    const infoWindow = new window.naver.maps.InfoWindow();
  
    window.naver.maps.Event.addListener(marker, "click", async () => {
      try {
        console.log(`Fetching marker info for CID: ${point.cid}`);
        const response = await fetch(`http://127.0.0.1:5001/api/marker/${point.cid}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
  
        const data = await response.json();
        console.log(`Marker info for CID ${point.cid}:`, data);
  
        const content = `
        <div style="padding:10px;">
          <strong>ID:</strong> ${point.cid}<br/>
          ${data.marker_info 
            ? `<strong>Last Record Date:</strong> ${data.marker_info.date}<br/>
               <strong>Amount:</strong> ${data.marker_info.amount}<br/>`
            : `<strong>Last Record Date:</strong> 없음<br/>
               <strong>Amount:</strong> 없음<br/>`}
          <button id="edit-button-${point.cid}" style="margin-top:10px;">ADD RECORD</button>
        </div>`;
        infoWindow.setContent(content);
        infoWindow.open(map.current, marker);
  
        setTimeout(() => {
          const editButton = document.getElementById(`edit-button-${point.cid}`);
          if (editButton) {
            editButton.addEventListener("click", () => handleEditClick(point.cid));
          }
        }, 0);
      } catch (error) {
        console.error("Failed to fetch marker info:", error);
      }
    });
  };

  const toggleGroupMarkers = async (group_id) => {
    if (!map.current) return;
  
    try {
      if (group_id === activeGroup) {
        // 현재 활성화된 그룹을 비활성화 (언토글)
        groupMarkers.forEach((marker) => marker.setMap(null)); // 기존 그룹 마커 제거
        setGroupMarkers([]); // 그룹 마커 상태 초기화
        setActiveGroup(null); // 활성화된 그룹 초기화
      
        // 기존 collectionPoints로 마커 재생성
        const newMarkers = collectionPoints.map((point) => {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(point.latitude, point.longitude),
            map: map.current,
            title: `ID: ${point.cid}`,
          });
      
          // 클릭 핸들러 추가
          attachMarkerClickHandler(marker, point);
      
          return marker;
        });

        // 지도 클릭 이벤트 리스너 복원
        if (map.current) {
          window.naver.maps.Event.addListener(map.current, "click", () => {
            // 모든 InfoWindow 닫기
            newMarkers.forEach((marker) => {
              if (marker.infoWindow) {
                marker.infoWindow.close();
              }
            });
          });
        }
      
        setGroupMarkers(newMarkers); // 업데이트된 마커 상태 저장
        return; // 여기서 종료
      }
  
      // 새로운 그룹의 마커 표시
      groupMarkers.forEach((marker) => marker.setMap(null)); // 기존 마커 제거
  
      const response = await fetch(`http://127.0.0.1:5001/api/group_markers/${group_id}`);
      const data = await response.json();
  
      const newMarkers = data.groups.map((group) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(group.latitude, group.longitude),
          map: map.current,
          title: `CID: ${group.cid}`, // 마커에 CID 표시
          icon: {
            content: `<div style="width: 20px; height: 20px; background-color: #ff3333; border-radius: 50%;"></div>`, // 빨간색 동그라미
          },
        });
  
        // 팝업 추가
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `<div style="padding:10px;">Group: ${group.name}</div>`,
        });
  
        return marker;
      });
  
      setGroupMarkers(newMarkers); // 새 마커 상태 저장
      setActiveGroup(group_id); // 활성화된 그룹 업데이트
    } catch (error) {
      console.error("Failed to toggle group markers:", error);
    }
  };
  

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);


  const [isAddingGroup, setIsAddingGroup] = useState(false); // 그룹 추가 모드 상태
  const [selectedRegion, setSelectedRegion] = useState(""); // 선택된 지역
  const [groupName, setGroupName] = useState(""); // 새 그룹 이름
  const [markers, setMarkers] = useState([]); // 현재 보여지는 마커
  const [selectedMarkers, setSelectedMarkers] = useState([]); // 그룹에 추가할 마커

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
  };

  const fetchMarkersByRegion = async (region) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/add_markers/${region}`);
      const data = await response.json();
  
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
    <div className={styles.page}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        groups={groups}
        toggleGroupMarkers={toggleGroupMarkers}
        isAddingGroup={isAddingGroup}
        map={map.current}
        uid={uid}
        fetchGroups={fetchGroups}
        activeGroup={activeGroup} // 현재 활성화된 그룹 전달
        setActiveGroup={setActiveGroup} // 상태 업데이트 함수 전달
        setGroupMarkers={setGroupMarkers}
        groupMarkers={groupMarkers}
        collectionPoints={collectionPoints}
        setCollectionPoints={setCollectionPoints}
      />
      <div id="map" className={styles.map} />
      {!isSidebarOpen && (
        <button onClick={toggleSidebar} className={styles.button}>
          열기
        </button>
      )}
    </div>
  );
}

export default Map;