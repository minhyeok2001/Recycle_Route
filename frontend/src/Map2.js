import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import styles from "./map2.module.css"

function Map() {
  const [currentPosition, setCurrentPosition] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 위치 (서울)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 상태
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
  }, [currentPosition]);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.page}>
      {/* 사이드바 */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

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
