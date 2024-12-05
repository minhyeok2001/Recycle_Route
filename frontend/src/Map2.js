import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

function Map() {
  const [map, setMap] = useState(null); // 지도 객체 상태
  const [currentPosition, setCurrentPosition] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 위치 (서울)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 사이드바 상태

  useEffect(() => {
    // 네이버 지도 초기화
    const mapDiv = document.getElementById("map");

    if (window.naver && window.naver.maps) {
      const mapInstance = new window.naver.maps.Map(mapDiv, {
        center: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
        zoom: 14,
      });
      setMap(mapInstance);
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
    if (map) {
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
        map,
      });
    }
  }, [map, currentPosition]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {/* 사이드바 */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* 지도 영역 */}
      <div id="map" style={{ width: "100%", height: "100%" }} />

      {/* 사이드바 열기 버튼 */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            zIndex: "1001",
            backgroundColor: "#f4f4f4",
            border: "1px solid #ccc",
            borderRadius: "3px",
            padding: "5px",
            cursor: "pointer",
          }}
        >
          열기
        </button>
      )}
    </div>
  );
}

export default Map;
