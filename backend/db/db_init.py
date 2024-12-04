import psycopg2
import pandas as pd
import numpy as np

file1_path = "./db1.csv"  # db1 파일 경로
file2_path = "./db2.csv"  # db2 파일 경로

# PostgreSQL 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port="5431",
        user="minhyeokroh",
        password="psql",
        database="db_project"
    )

# 테이블 생성 함수
def create_tables():
    queries = [
        """
        CREATE TABLE IF NOT EXISTS clothing_box (
            cID SERIAL PRIMARY KEY,
            district VARCHAR (30) NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL
        )
        """
    ]
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                for query in queries:
                    cursor.execute(query)
                    print(f"테이블 생성 성공: {query.split('(')[0].strip()}")
        print("모든 테이블 생성 완료")
    except Exception as e:
        print(f"데이터베이스 초기화 실패: {e}")
    finally:
        if conn:
            conn.close()

def insert_clothing_boxes():
    try:
        # db1과 db2 읽기
        db1 = pd.read_csv(file1_path, encoding="euc-kr")
        db2 = pd.read_csv(file2_path, encoding="euc-kr")

        # 열 이름 재설정
        db1.columns = ['의류수거함', '위치', '위도', '경도']
        db2.columns = ['행정동', '도로명주소', '지번주소', '위도', '경도', '데이터기준일자']

        # 행정동에서 숫자 제거
        db2['행정동'] = db2['행정동'].str.replace(r'\d+', '', regex=True)

        # 의류수거함에서 하이픈과 숫자 제거
        db1['의류수거함'] = db1['의류수거함'].str.replace(r'-\d+', '', regex=True)

        # 행정동과 의류수거함 데이터 정리
        db1['district'] = db1['의류수거함']
        db2['district'] = db2['행정동']

        # 위도와 경도 열 및 district 추출
        db1_lat_lng = db1[['district', '위도', '경도']].dropna()
        db2_lat_lng = db2[['district', '위도', '경도']].dropna()

        # 두 데이터를 병합
        combined_data = pd.concat([db1_lat_lng, db2_lat_lng]).drop_duplicates()

        # PostgreSQL에 연결
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # clothing_box 테이블에 데이터 삽입
                for _, row in combined_data.iterrows():
                    district = row['district']
                    latitude = row['위도']
                    longitude = row['경도']
                    cursor.execute(
                        "INSERT INTO clothing_box (district, latitude, longitude) VALUES (%s, %s, %s)",
                        (district, latitude, longitude)
                    )
                print("위도, 경도 및 district 데이터 삽입 완료!")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    
    """
    with open('./db1.csv', 'rb') as f:
        result = chardet.detect(f.read())
        print(result)

    with open('./db2.csv', 'rb') as f:
        result = chardet.detect(f.read())
        print(result)
    """
    # 테이블 생성 및 데이터 삽입 호출
    create_tables()
    insert_clothing_boxes()