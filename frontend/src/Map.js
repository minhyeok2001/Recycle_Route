import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

function Map({uid}) {
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
        const response = await fetch("http://127.0.0.1:5001/api/home", {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // 요청 헤더 설정
          },
          body: JSON.stringify({ uid }), // 요청 데이터
        });
        const data = await response.json();
        setCollectionPoints(data.group_markers); // 데이터 상태 업데이트
      } catch (error) {
        console.error("Failed to fetch collection points:", error);
      }
    };

    fetchData();
  }, []);

  // 의류 수거함 위치에 마커 추가
  useEffect(() => {
    if (map && collectionPoints.length > 0 && window.naver && window.naver.maps) {
      collectionPoints.forEach((point) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(point.latitude, point.longitude),
          map: map,
          title: `ID: ${point.cid}`, // 마커 제목에 cid 표시
        });
  
        const infoWindow = new window.naver.maps.InfoWindow();
  
        // 마커 클릭 시 팝업 표시 및 데이터 요청
        window.naver.maps.Event.addListener(marker, "click", async () => {
          try {
            // Flask API 호출
            const response = await fetch(`http://127.0.0.1:5001/api/marker/${point.cid}`);
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
  
            const data = await response.json();
  
            // 서버 응답 데이터 기반으로 팝업 내용 설정
            const content = data.marker_info
              ? `<div style="padding:10px;">
                  <strong>ID:</strong> ${point.cid}<br/>
                  <strong>Last Record Date:</strong> ${data.marker_info.date}<br/>
                  <strong>Amount:</strong> ${data.marker_info.amount}<br/>
                  <button id="edit-button-${point.cid}" style="margin-top:10px;">Edit</button>
                 </div>`
              : `<div style="padding:10px;">No record available for this marker<br/>
              <button id="edit-button-${point.cid}" style="margin-top:10px;">Edit</button></div>
              `;
  
            // InfoWindow 내용 업데이트 후 표시
            infoWindow.setContent(content);
            infoWindow.open(map, marker);

            setTimeout(() => {
              const editButton = document.getElementById(`edit-button-${point.cid}`);
              if (editButton) {
                editButton.addEventListener("click", () => {
                  handleEditClick(point.cid);
                });
              }
            }, 0);
            
          } catch (error) {
            console.error("Failed to fetch marker info:", error);
  
            // 에러 메시지 표시
            infoWindow.setContent(`<div style="padding:10px;">Error fetching marker data</div>`);
            infoWindow.open(map, marker);
          }
        });
      });
    }
  
    // Edit 버튼 클릭 핸들러
    const handleEditClick = (cid) => {
      const newDate = prompt("Enter new date (YYYY-MM-DD):");
      const newAmount = prompt("Enter new amount:");
  
      if (newDate && newAmount) {
        // Flask API로 수정 요청
        fetch(`http://127.0.0.1:5001/api/marker/${cid}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ date: newDate, amount: newAmount }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            alert("Record updated successfully!");
            console.log("Updated Data:", data);
          })
          .catch((error) => {
            console.error("Failed to update marker info:", error);
            alert("Failed to update record.");
          });
      } else {
        alert("Invalid input. Update cancelled.");
      }
    };
  }, [map, collectionPoints]);
  

  return (
    <div>
      <div id="map" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

export default Map;