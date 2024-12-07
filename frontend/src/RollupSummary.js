import React, { useState, useEffect } from "react";
import styled from "styled-components";

// 스타일 컴포넌트 추가
const RollupContainer = styled.div`
  margin-top: 10px;
  padding: 8px;
  background-color: #f1f1f1;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-size: 0.9rem; /* 텍스트 크기를 작게 조정 */
`;

const RollupItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid #ddd;
  font-size: 0.85rem; /* 텍스트 크기를 더 작게 조정 */
  color: #333; /* 텍스트 색상 */
  line-height: 1.2;
`;

const RollupSummary = () => {
  const [rollupData, setRollupData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRollupData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5001/api/district_rollup");
        const data = await response.json();
        if (response.ok) {
          setRollupData(data.rollup_summary);
        } else {
          throw new Error(data.error || "Failed to fetch rollup data");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRollupData();
  }, []);

  return (
    <RollupContainer>
      <h3>행정구역 별 전체 수거량 합계</h3>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : rollupData.length > 0 ? (
        rollupData.map((item, index) => (
          <RollupItem key={index}>
            <span>{item.district}</span>
            <span>{item.total_amount}kg</span>
          </RollupItem>
        ))
      ) : (
        <p>데이터를 불러오는 중...</p>
      )}
    </RollupContainer>
  );
};

export default RollupSummary;