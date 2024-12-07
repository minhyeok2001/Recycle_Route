import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import styles from "./map2.module.css"
import axios from "axios";

function Map({uid}) {
  const [currentPosition, setCurrentPosition] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 위치 (서울)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 상태
  const [groups, setGroups] = useState([]);
  const [groupMarkers, setGroupMarkers] = useState([]);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("현재 위치:", latitude, longitude);
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
    new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
      map: map.current,
    });
  }, [currentPosition]);


  useEffect(() => {
    // 홈 데이터 요청
    const fetchGroups = async () => {
      console.log(uid);
      try {
        const response = await fetch("http://127.0.0.1:5001/api/home", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // 요청 헤더 설정
          },
          body: JSON.stringify({ uid }), // 요청 데이터
        });

        // 서버로부터 데이터 받아서 상태 업데이트
        const data = await response.json();
        console.log("서버 응답 데이터:", data); // 응답 데이터 확인

        setGroups(data.groups); // 그룹 데이터 설정
        setGroupMarkers(data.group_markers); // 초기 마커 설정
      } catch (error) {
        console.error("데이터 요청 실패:", error);
      }
    };

    if (uid) {
      fetchGroups();
    }
  }, [uid]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleGroupMarkers = async (group_id) => {
    if (group_id === activeGroup) {
      // 동일한 그룹을 다시 클릭하면 마커 제거
      groupMarkers.forEach((marker) => marker.setMap(null));
      setGroupMarkers([]);
      setActiveGroup(null);
    } else {
      // 이전 마커 제거
      groupMarkers.forEach((marker) => marker.setMap(null));

      // 새로운 그룹의 마커 가져오기
      try {
        const response = await fetch(`http://127.0.0.1:5001/api/group_markers/${group_id}`);
        const data = await response.json();
        const newMarkers = data.cids.map((cid) => {
          const marker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(cid.latitude, cid.longitude),
            map,
            title: `CID: ${cid.cid}`,
          });
          return marker;
        });

        setGroupMarkers(newMarkers);
        setActiveGroup(group_id); // 활성화된 그룹 업데이트
      } catch (error) {
        console.error("Failed to toggle group markers:", error);
      }
    }
  };

  return (
    <div className={styles.page}>
      {/* 사이드바 */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} groups={groups} toggleGroupMarkers={toggleGroupMarkers} />

      {/* 지도 영역 */}
      <div id="map" className={styles.map} />

      {/* 사이드바 열기 버튼 */}
      {!isSidebarOpen && (
        <button onClick={toggleSidebar} className={styles.button}>열기</button>
      )}
    </div>
  );
}

export default Map;
