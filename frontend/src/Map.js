import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

function Map() {
  const [map, setMap] = useState(null); // 지도 객체 상태
  const [currentPosition, setCurrentPosition] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 위치 (서울)
  const [collectionPoints, setCollectionPoints] = useState([]); //의류수거함 데이터 상태

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

  // 현재 위치 가져오기
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

  //현재 위치 지도에 마킹하기
  useEffect(() => {
    if (map) {
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(currentPosition.lat, currentPosition.lng),
        map,
      });
    }
  }, [map, currentPosition]);
  
  //의류수거함 위치 데이터 들고오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/marker/{cid}"); // 백엔드 엔드포인트 호출
        const data = await response.json();
        setCollectionPoints(data); // 데이터 상태 업데이트
      } catch (error) {
        console.error("Failed to fetch collection points:", error);
      }
    };

    fetchData();
  }, []);

  // 의류 수거함 위치에 마커 추가
  useEffect(() => {
    if (map && collectionPoints.length > 0) {
      collectionPoints.forEach((point) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(point.latitude, point.longitude),
          map: map,
          title: point.name, // 마커에 이름 표시
        });

        // 마커 클릭 시 팝업 표시
        const infoWindow = new window.naver.maps.InfoWindow({
            content: `<div style="padding:10px;">${point.name}</div>`,
          });
  
          window.naver.maps.Event.addListener(marker, "click", () => {
            infoWindow.open(map, marker);
          });
      });
    }
  }, [map, collectionPoints]);
  

  return (
    <div>
      <div id="map" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

export default Map;
