import React, { useState } from "react";
import Map from "./Map";
import Login from "./Login"; // 새로운 로그인 화면 컴포넌트 추가
import Map2 from "./Map2";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 관리
  const [uid, setUid] = useState(null); // uid 상태 추가

  return (
    <div>
      {isLoggedIn ? (
        <>
        <Map2 uid={uid} />
          <Map uid={uid} />
        </>
      ) : (
        <Login setIsLoggedIn={setIsLoggedIn}  setUid={setUid} />
      )}
    </div>
  );
}

export default App;
