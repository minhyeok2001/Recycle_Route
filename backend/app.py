from flask import Flask, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2

app = Flask(__name__)
app.secret_key = 'hola~' 

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

# create_tables()


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

                -- 데이터 삽입
                INSERT INTO user_marker (uID, cID)
                VALUES (random_uid, random_cid)
                ON CONFLICT DO NOTHING; -- 중복된 (uID, cID) 삽입 시 무시
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

# create_dummy_tables()

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

                session['uid'] = user[0]
                return jsonify({'success': True, 'message': '로그인 성공!'}), 200
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
@app.route('/api/home', methods=['GET'])
def home():
    user_id = session.get('uid')
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
                if group_ids:  # 그룹이 있는 경우에만 쿼리 실행
                    cursor.execute("""
                        SELECT cb.cID, cb.district, cb.latitude, cb.longitude
                        FROM group_markers gm
                        INNER JOIN clothing_box cb ON gm.cID = cb.cID
                        WHERE gm.group_id = ANY(%s)
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
                if not record:
                    return jsonify({'error': '기록이 없습니다.'}), 404
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
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO clothing_record (cID, date, amount)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (cID, date)
                    DO UPDATE SET amount = EXCLUDED.amount;
                """, (cid, date, amount))
                return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

"""
첫 화면에서 group 받아주니까..

# 그룹 조회
@app.route('/api/groups', methods=['GET'])
def get_groups():
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 확인 (로그인 기반)
                user_id = session.get('uid')
                if not user_id:
                    return jsonify({'error': 'User not logged in'}), 401

                # 그룹 정보 조회
                cursor.execute("
                    SELECT group_id, name
                    FROM groups
                    WHERE uID = %s;
                "", (user_id,))
                groups = cursor.fetchall()

                if not groups:
                    return jsonify({'groups': []})  # 그룹이 없는 경우 빈 리스트 반환

                result = [{'group_id': group[0], 'name': group[1]} for group in groups]
                return jsonify({'groups': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



# 그룹 추가
@app.route('/api/add_group', methods=['POST'])
def add_group():
    data = request.json
    group_name = data.get('group_name')
    cid_list = data.get('cid_list')

    if not group_name or not cid_list:
        return jsonify({'error': '그룹명과 마커 리스트를 입력해주세요.'}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(""
                    INSERT INTO groups (name, uID)
                    VALUES (%s, %s)
                    RETURNING group_id;
                "", (group_name, session['uid']))
                group_id = cursor.fetchone()[0]

                for cid in cid_list:
                    cursor.execute(""
                        INSERT INTO group_markers (group_id, cID)
                        VALUES (%s, %s);
                    "", (group_id, cid))
                return jsonify({'success': True, 'group_id': group_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/group/<int:group_id>', methods=['GET'])
def get_group_markers(group_id):
    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 특정 그룹에 속한 마커 정보 조회
                cursor.execute(""
                    SELECT cb.cID, cb.district, cb.latitude, cb.longitude
                    FROM group_markers gm
                    INNER JOIN clothing_box cb ON gm.cID = cb.cID
                    WHERE gm.group_id = %s;
                "", (group_id,))
                markers = cursor.fetchall()
                if not markers:
                    return jsonify({'error': 'No markers found for the group.'}), 404
                
                result = [{'cid': marker[0], 'district': marker[1], 'latitude': marker[2], 'longitude': marker[3]} for marker in markers]
                return jsonify({'markers': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

"""

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
def confirm_add_markers(region):
    data = request.json
    group_name = data.get('group_name')
    cid_list = data.get('cid_list')

    if not cid_list or not isinstance(cid_list, list):
        return jsonify({'error': 'Invalid input. Provide a list of cIDs.'}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 확인 (로그인 기반)
                user_id = session.get('uid')
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


if __name__ == '__main__':
    app.run(debug=True)