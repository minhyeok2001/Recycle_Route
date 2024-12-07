from flask import Flask, request, jsonify, session,make_response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2


app = Flask(__name__)

app.config['SECRET_KEY'] = 'your-secret-key'

CORS(app)

# PostgreSQL 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port="5431",
        user="postgres",
        password="psql",
        database="db_project"
    )

# 테이블 생성 함수
def create_tables():
    table_creation_queries = [
        """
        CREATE TABLE IF NOT EXISTS user_info (
            uID SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            pw TEXT NOT NULL
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS clothing_record (
            cID INT NOT NULL,
            date DATE NOT NULL,
            amount INT NOT NULL,
            PRIMARY KEY (cID, date),
            FOREIGN KEY (cID) REFERENCES clothing_box(cID) ON DELETE CASCADE
        );

        -- groups 테이블 생성
        CREATE TABLE IF NOT EXISTS groups (
            group_id SERIAL PRIMARY KEY,   -- 고유 그룹 ID
            name VARCHAR(255) NOT NULL,    -- 그룹 이름
            uID INT NOT NULL,              -- 그룹 생성자 (user_info의 uID 참조)
            FOREIGN KEY (uID) REFERENCES user_info(uID) ON DELETE CASCADE
        );

        -- group_markers 테이블 생성
        CREATE TABLE IF NOT EXISTS group_markers (
            group_id INT NOT NULL,         -- 그룹 ID (groups의 group_id 참조)
            cID INT NOT NULL,              -- clothing_box의 cID 참조
            PRIMARY KEY (group_id, cID),   -- 복합 기본키 (group_id와 cID의 중복 방지)
            FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
            FOREIGN KEY (cID) REFERENCES clothing_box(cID) ON DELETE CASCADE
        );
        """
    ]

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                for query in table_creation_queries:
                    cursor.execute(query)
                print("create dummy !!")
    except Exception as e:
        print(f"테이블 생성 중 오류 발생: {e}")
    finally:
        conn.close()



#insert dummyfile 

def create_dummy_tables():
    dummy_queries = [
        """
        -- user_info 테이블에 200명의 더미 사용자 데이터 삽입
        DO $$
        DECLARE
            i INT;
        BEGIN
            FOR i IN 1..200 LOOP
                INSERT INTO user_info (email, pw)
                VALUES (
                    CONCAT('testuser', i, '@example.com'),
                    CONCAT('hashed_password_', i)
                );
            END LOOP;
        END $$;


        -- clothing_record 테이블에 200개의 더미 데이터 삽입
        DO $$
        DECLARE
            i INT;
            random_cid INT;
            random_date DATE;
            random_amount INT;
        BEGIN
            FOR i IN 1..200 LOOP
                -- 1 ~ 1300 사이의 랜덤 cID 생성
                random_cid := FLOOR(RANDOM() * 1300) + 1;

                -- 과거 1년 이내의 랜덤 날짜 생성
                random_date := CURRENT_DATE - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL;

                -- 1 ~ 50 사이의 랜덤 수거량 생성
                random_amount := FLOOR(RANDOM() * 50) + 1;

                -- 데이터 삽입
                INSERT INTO clothing_record (cID, date, amount)
                VALUES (random_cid, random_date, random_amount);
            END LOOP;
        END $$;

        -- user_marker 테이블에 200개의 더미 데이터 삽입
        DO $$
        DECLARE
            i INT;
            random_uid INT;
            random_cid INT;
        BEGIN
            FOR i IN 1..200 LOOP
                -- user_info에서 랜덤으로 uID 가져오기
                SELECT uID
                INTO random_uid
                FROM user_info
                ORDER BY RANDOM()
                LIMIT 1;

                -- clothing_box에서 랜덤으로 cID 가져오기
                SELECT cID
                INTO random_cid
                FROM clothing_box
                ORDER BY RANDOM()
                LIMIT 1;
            END LOOP;
        END $$;


        -- groups 테이블에 200개의 더미 데이터 삽입
        DO $$
        DECLARE
            i INT;
            random_uid INT;
        BEGIN
            FOR i IN 1..200 LOOP
                -- user_info에서 랜덤으로 uID 가져오기
                SELECT uID
                INTO random_uid
                FROM user_info
                ORDER BY RANDOM()
                LIMIT 1;

                -- 그룹 데이터 삽입
                INSERT INTO groups (name, uID)
                VALUES (
                    CONCAT('Group ', i),  -- 그룹 이름: Group 1, Group 2, ...
                    random_uid            -- 랜덤으로 선택된 uID
                );
            END LOOP;
        END $$;

        -- group_markers 테이블에 200개의 더미 데이터 삽입
        DO $$
        DECLARE
            i INT;
            random_group_id INT;
            random_cid INT;
        BEGIN
            FOR i IN 1..200 LOOP
                -- groups에서 랜덤으로 group_id 가져오기
                SELECT group_id
                INTO random_group_id
                FROM groups
                ORDER BY RANDOM()
                LIMIT 1;

                -- clothing_box에서 랜덤으로 cID 가져오기
                SELECT cID
                INTO random_cid
                FROM clothing_box
                ORDER BY RANDOM()
                LIMIT 1;

                -- group_markers 데이터 삽입
                INSERT INTO group_markers (group_id, cID)
                VALUES (random_group_id, random_cid)
                ON CONFLICT DO NOTHING;  -- 중복된 (group_id, cID) 조합이 있으면 무시
            END LOOP;
        END $$;
        """
    ]
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                for query in dummy_queries:
                    cursor.execute(query)
                print("모든 테이블이 성공적으로 생성되었습니다.")
    except Exception as e:
        print(f"테이블 생성 중 오류 발생: {e}")
    finally:
        conn.close()




def insert_test_data():
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # user_info에 사용자 추가
                cursor.execute("""
                    INSERT INTO user_info (email, pw)
                    VALUES ('hahasssd', '0000')
                    ON CONFLICT DO NOTHING;
                """)
                
                # 해당 사용자의 uID 가져오기
                cursor.execute("SELECT uID FROM user_info WHERE email = 'hahasssd';")
                user_id = cursor.fetchone()[0]

                # groups에 그룹 추가
                cursor.execute("""
                    INSERT INTO groups (name, uID)
                    VALUES ('테스트 그룹 1', %s), ('테스트 그룹 2', %s)
                    ON CONFLICT DO NOTHING
                    RETURNING group_id;
                """, (user_id, user_id))
                group_ids = cursor.fetchall()
                
                # clothing_box에 마커 추가
                cursor.execute("""
                    INSERT INTO clothing_box (district, latitude, longitude)
                    VALUES 
                    ('가산동', 37.481, 126.882),
                    ('독산동', 37.482, 126.883),
                    ('시흥동', 37.483, 126.884)
                    ON CONFLICT DO NOTHING
                    RETURNING cID;
                """)
                marker_ids = cursor.fetchall()

                # group_markers에 그룹과 마커 연결
                for group_id in group_ids:
                    for marker_id in marker_ids:
                        cursor.execute("""
                            INSERT INTO group_markers (group_id, cID)
                            VALUES (%s, %s)
                            ON CONFLICT DO NOTHING;
                        """, (group_id[0], marker_id[0]))

                print("테스트 데이터 삽입 완료!")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        if conn:
            conn.close()


# 트리거와 뷰 추가.
def insert_view_trigger():
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # cid
                cursor.execute("""
                CREATE OR REPLACE VIEW group_markers_view AS
                SELECT 
                    gm.group_id,
                    cb.cID,
                    cb.district,
                    cb.latitude,
                    cb.longitude
                FROM group_markers gm
                INNER JOIN clothing_box cb ON gm.cID = cb.cID;

                CREATE OR REPLACE FUNCTION validate_amount()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.amount < 1 OR NEW.amount > 100 THEN
                        RAISE EXCEPTION 'Amount must be between 1 and 100';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER validate_amount_trigger
                BEFORE INSERT OR UPDATE ON clothing_record
                FOR EACH ROW
                EXECUTE FUNCTION validate_amount();
                """)

                print("view, trigger 설정 완료")
    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        if conn:
            conn.close()


flag = 0

if flag == 1:
    create_tables()
    create_dummy_tables()
    insert_test_data()
    insert_view_trigger()

# 회원가입 엔드포인트
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': '이메일과 비밀번호를 입력해주세요.'}), 400

    hashed_password = generate_password_hash(password)
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO user_info (email, pw)
                    VALUES (%s, %s);
                """, (email, hashed_password))
                return jsonify({'success': True, 'message': '회원가입 성공!'}), 201
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({'error': '이미 존재하는 이메일입니다.'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 로그인 엔드포인트
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': '이메일과 비밀번호를 입력해주세요.'}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT uID, pw
                    FROM user_info
                    WHERE email = %s;
                """, (email,))
                user = cursor.fetchone()
                if not user or not check_password_hash(user[1], password):
                    return jsonify({'error': '이메일 또는 비밀번호가 잘못되었습니다.'}), 401

                resp = make_response(jsonify({'success': True, 'uid': user[0]}))
                
                return resp
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 이거 use effect로 처음에만 가져오기
@app.route('/api/districts', methods=['GET'])
def get_districts():
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # clothing_box 테이블에서 고유한 district 조회
                cursor.execute("""
                    SELECT DISTINCT district
                    FROM clothing_box
                    ORDER BY district ASC;
                """)
                districts = cursor.fetchall()

                # 결과를 JSON으로 변환
                result = [district[0] for district in districts]
                return jsonify({'districts': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
# 홈 화면 요청
@app.route('/api/home',  methods=['POST'])
def home():
    data = request.json
    user_id = data.get('uid')
    print(f"Request data: {data}")  # 요청 데이터 확인
    if not user_id:
        return jsonify({'error': '로그인이 필요합니다.'}), 401
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 유저가 가진 그룹 정보 가져오기
                cursor.execute("""
                    SELECT g.group_id, g.name
                    FROM groups g
                    WHERE g.uID = %s
                """, (user_id,))
                groups = cursor.fetchall()

                # 그룹 ID를 리스트로 추출
                group_ids = [group[0] for group in groups]

                # 그룹에 속한 마커 정보 가져오기
                group_markers = []
                if group_ids:  # 그룹이 있는 경우에만 쿼리 실행 -> 이거 view로 따로 뺴기
                    cursor.execute("""
                        SELECT cID, district, latitude, longitude
                        FROM group_markers_view
                        WHERE group_id = ANY(%s);
                    """, (group_ids,))
                    group_markers = cursor.fetchall()

                # 결과 정리
                result = {
                    'group_markers': [
                        {
                            'cid': m[0],
                            'latitude': m[2],
                            'longitude': m[3],
                        } for m in group_markers
                    ],
                    'groups': [
                        {
                            'group_id': g[0],
                            'name': g[1]
                        } for g in groups
                    ]
                }
                return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
# 마커 정보 조회
@app.route('/api/marker/<int:cid>', methods=['GET'])
def get_marker_info(cid):
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT cr.date, cr.amount
                    FROM clothing_record cr
                    WHERE cr.cID = %s
                    ORDER BY cr.date DESC
                    LIMIT 1;
                """, (cid,))
                record = cursor.fetchone()
                # 기록이 없을 경우 빈 데이터 반환
                if not record:
                    return jsonify({'marker_info': None})  # 빈 데이터로 응답
                return jsonify({'marker_info': {'date': record[0], 'amount': record[1]}})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 마커 정보 수정
@app.route('/api/marker/<int:cid>', methods=['POST'])
def update_marker_info(cid):
    data = request.json
    date = data.get('date')
    amount = data.get('amount')

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:   # 여기서 trigger 발생 !! 즉 한번 수거량이 의류수거함 최대 개수를 넘지 않도록 
                cursor.execute("""
                    INSERT INTO clothing_record (cID, date, amount)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cID, date)
                    DO UPDATE SET amount = EXCLUDED.amount;
                """, (cid, date, amount))
                return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/add_markers/<region>', methods=['GET'])
def add_markers(region):
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 특정 지역(region)의 마커 정보 조회
                cursor.execute("""
                    SELECT cID, district, latitude, longitude
                    FROM clothing_box
                    WHERE district = %s;
                """, (region,))
                markers = cursor.fetchall()
                if not markers:
                    return jsonify({'error': 'No markers found for the region.'}), 404
                
                result = [{'cid': marker[0], '': marker[1], 'latitude': marker[2], 'longitude': marker[3]} for marker in markers]
                return jsonify({'markers': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/add_markers/confirm', methods=['POST'])
def confirm_add_markers():
    data = request.json
    group_name = data.get('group_name')
    cid_list = data.get('cid_list')
    user_id = data.get('uid')
    print(user_id)

    if not cid_list or not isinstance(cid_list, list):
        return jsonify({'error': 'Invalid input. Provide a list of cIDs.'}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 확인 (로그인 기반)
                if not user_id:
                    return jsonify({'error': 'User not logged in'}), 401

                 # 새로운 그룹 생성
                cursor.execute("""
                    INSERT INTO groups (name, uID)
                    VALUES (%s, %s)
                    RETURNING group_id;
                """, (group_name, user_id))
                group_id = cursor.fetchone()[0]  # 생성된 그룹 ID 반환

                # 그룹에 마커 추가
                for cid in cid_list:
                    cursor.execute("""
                        INSERT INTO group_markers (group_id, cID)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING;  -- 중복 방지
                    """, (group_id, cid))

                return jsonify({'success': True, 'group_id': group_id, 'message': 'Group created successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
@app.route('/api/group_markers/<int:group_id>', methods=['GET'])
def get_group_markers(group_id):
    """
    주어진 그룹 ID에 속한 마커 데이터를 반환
    """
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 그룹 ID에 속한 마커 정보 가져오기
                cursor.execute("""
                    SELECT gm.cID, cb.latitude, cb.longitude
                    FROM group_markers gm
                    JOIN clothing_box cb ON gm.cID = cb.cID
                    WHERE gm.group_id = %s;
                """, (group_id,))
                markers = cursor.fetchall()
                
                if not markers:
                    return jsonify({'error': 'No markers found for the specified group.'}), 404
                
                # 마커 데이터 가공
                result = [
                    {
                        'cid': marker[0],
                        'latitude': marker[1],
                        'longitude': marker[2],
                    } for marker in markers
                ]

                return jsonify({'groups': result})  # 응답에 그룹 데이터 포함
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete_group/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 그룹 삭제
                cursor.execute("""
                    DELETE FROM groups
                    WHERE group_id = %s;
                """, (group_id,))

                # 그룹에 연결된 마커도 삭제 (옵션)
                cursor.execute("""
                    DELETE FROM group_markers
                    WHERE group_id = %s;
                """, (group_id,))

        return jsonify({'success': True, 'message': 'Group deleted successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 행정구역 별 전체 수거량 합계 OLAP
@app.route('/api/district_rollup', methods=['GET'])
def get_district_rollup():
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""  
                    SELECT district, SUM(amount) AS total_amount
                    FROM clothing_record cr
                    JOIN clothing_box cb ON cr.cID = cb.cID
                    GROUP BY ROLLUP(cb.district);
                """)
                rollup_data = cursor.fetchall()
                result = [
                    {
                        'district': row[0] if row[0] else '전체',
                        'total_amount': row[1]
                    } for row in rollup_data
                ]
                return jsonify({'rollup_summary': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True,port=5001)