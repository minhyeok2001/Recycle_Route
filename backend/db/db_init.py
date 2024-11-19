import psycopg2
import pandas as pd

file1_path = "./db1.csv"  # db1 파일 경로
file2_path = "./db2.csv"  # db2 파일 경로

# PostgreSQL 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port="5432",
        user="minhyeokroh",
        password="psql",
        database="db_project"
    )

# 테이블 생성 함수
def create_tables():
    queries = [
        """
        CREATE TABLE IF NOT EXISTS user_info (
            uID SERIAL PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            pw VARCHAR(200) NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS clothing_box (
            cID SERIAL PRIMARY KEY,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS clothing_record (
            cID INTEGER REFERENCES clothing_box(cID) ON DELETE CASCADE,
            date DATE NOT NULL,
            amount FLOAT NOT NULL,
            PRIMARY KEY (cID, date)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS user_marker (
            uID INTEGER REFERENCES user_info(uID) ON DELETE CASCADE,
            cID INTEGER REFERENCES clothing_box(cID) ON DELETE CASCADE,
            PRIMARY KEY (uID, cID)
        )
        """,
        """

        CREATE TABLE user_groups (
            groupID SERIAL PRIMARY KEY,
            groupName VARCHAR(100) NOT NULL,
            uID INTEGER REFERENCES user_info(uID) ON DELETE CASCADE
        )
        """,
        """
        CREATE TABLE group_markers (
            groupID INTEGER REFERENCES user_groups(groupID) ON DELETE CASCADE,
            cID INTEGER REFERENCES clothing_box(cID) ON DELETE CASCADE,
            PRIMARY KEY (groupID, cID)
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
        db1 = pd.read_csv(file1_path, encoding="ISO-8859-1")
        # print(db1.head())
        db2 = pd.read_csv(file2_path, encoding="ISO-8859-1")
        # print(db2.head())

        # 열 이름 재설정
        db1.columns = ['의류수거함', '위치', '위도', '경도']
        db2.columns = ['행정동', '도로명주소', '지번주소', '위도', '경도', '데이터기준일자']

        print(db2.head())
        # 위도와 경도 열 추출

        db1_lat_lng = db1[['위도', '경도']].dropna()
        db2_lat_lng = db2[['위도', '경도']].dropna()

        # 두 데이터를 병합
        combined_data = pd.concat([db1_lat_lng, db2_lat_lng]).drop_duplicates()

        # PostgreSQL에 연결
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # clothing_box 테이블에 데이터 삽입
                for _, row in combined_data.iterrows():
                    latitude = row['위도']
                    longitude = row['경도']
                    cursor.execute(
                        "INSERT INTO clothing_box (latitude, longitude) VALUES (%s, %s)",
                        (latitude, longitude)
                    )
                print("위도와 경도 데이터 삽입 완료!")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # 테이블 생성 및 데이터 삽입 호출
    create_tables()
    insert_clothing_boxes()