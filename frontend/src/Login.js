import React, { useState } from "react";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false); // 회원가입과 로그인 화면 분리

  const handleSubmit = async () => {
    const endpoint = isSignup ? "http://127.0.0.1:5000/api/signup" : "http://127.0.0.1:5000/api/login";
    const body = JSON.stringify({ email, password });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({email,password}),
      });

      const data = await response.json();

      if (response.ok) {
        alert(isSignup ? "회원가입 성공" : "로그인 성공");
        if (!isSignup) setIsLoggedIn(true); // 로그인 성공 시 화면 전환
      } else {
        alert(data.message || "오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>{isSignup ? "회원가입" : "로그인"}</h2>
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "10px", width: "300px" }}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "10px", width: "300px" }}
      />
      <button onClick={handleSubmit} style={{ padding: "10px 20px", marginTop: "10px" }}>
        {isSignup ? "회원가입" : "로그인"}
      </button>
      <button
        onClick={() => setIsSignup(!isSignup)}
        style={{
          display: "block",
          margin: "20px auto",
          padding: "10px 20px",
          background: "transparent",
          border: "none",
          color: "blue",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {isSignup ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 회원가입"}
      </button>
    </div>
  );
}

export default Login;
