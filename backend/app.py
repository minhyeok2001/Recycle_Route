from flask import Flask, request, jsonify, session
import psycopg2
from geopy.distance import geodesic

app = Flask(__name__)
app.secret_key = b'g\xfc\x06\xb4lL\xd3^\xf9<\xa7\xb0\xf5j\xa7\x1e'  # 세션 관리용 비밀 키

# PostgreSQL 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port="5432",
        user="",
        password="1234",
        database="postgres"
    )

# 회원가입 엔드포인트
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "이메일과 비밀번호가 필요합니다."}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 중복 확인
                cursor.execute("SELECT uID FROM user_info WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify({"error": "이미 존재하는 이메일입니다."}), 409

                # 사용자 추가
                cursor.execute(
                    "INSERT INTO user_info (email, pw) VALUES (%s, %s)",
                    (email, password)
                )
                return jsonify({"message": "회원가입 성공!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 로그인 엔드포인트
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "이메일과 비밀번호가 필요합니다."}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 확인
                cursor.execute(
                    "SELECT uID FROM user_info WHERE email = %s AND pw = %s",
                    (email, password)
                )
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "이메일 또는 비밀번호가 잘못되었습니다."}), 401

                # 세션 저장
                session['user'] = email
                return jsonify({"message": "로그인 성공!", "email": email}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 로그아웃 엔드포인트
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "로그아웃 성공!"}), 200

# 홈 엔드포인트

# 홈에서는 일단 토글 안하면 내 마커 찍힌거만 가져오기
# 토글 누르면 전체 보기 ( 내꺼는 색칠하고 )

@app.route('/home', methods=['GET'])   
def home():
    if 'user' in session:
        email = session['user']

        try:
            conn = get_db_connection()
            with conn:
                with conn.cursor() as cursor:
                    # 사용자 ID 가져오기
                    cursor.execute("SELECT uID FROM user_info WHERE email = %s", (email,))
                    user_id = cursor.fetchone()

                    if not user_id:
                        return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404

                    # 사용자 북마크 가져오기
                    cursor.execute(
                        "SELECT cID FROM user_marker WHERE uID = %s",
                        (user_id[0],)
                    )
                    bookmarks = [row[0] for row in cursor.fetchall()]

                    # 북마크 데이터 준비
                    bookmarks_data = []
                    for cID, lat, lng in bookmarks:
                        bookmarks_data.append({
                            "cID": cID,
                            "latitude": lat,
                            "longitude": lng
                        })
                        
                    return jsonify({
                        "user": email,
                        "bookmarks": bookmarks_data,
                        "message": "의류 수거함 데이터 로드 성공"
                    }), 200
                
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "로그인되어 있지 않습니다."}), 401


# 만약 내 북마크에 포함된 지점인 경우, 해당 지점 누르면 기록 추가 (북마크 확인 로직 포함)
@app.route('/home/point', methods=['POST'])
def point_info_save():
    try:
        # 요청 데이터에서 필요한 값 가져오기
        if 'user' not in session:
            return jsonify({"error": "로그인이 필요합니다."}), 401

        email = session['user']
        data = request.json
        cID = data.get('cid')
        date = data.get('date')  # "YYYY-MM-DD" 형식
        amount = data.get('amount')

        # 데이터 유효성 검사
        if not cID or not date or amount is None:
            return jsonify({"error": "cid, date, amount가 필요합니다."}), 400

        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 가져오기
                cursor.execute("SELECT uID FROM user_info WHERE email = %s", (email,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404
                user_id = user[0]

                # 사용자가 북마크한 포인트인지 확인
                cursor.execute(
                    "SELECT 1 FROM user_marker WHERE uID = %s AND cID = %s",
                    (user_id, cID)
                )
                if not cursor.fetchone():
                    return jsonify({"error": "해당 지점은 사용자의 북마크에 없습니다."}), 403

                # 새로운 기록 추가
                cursor.execute(
                    "INSERT INTO clothing_record (cID, date, amount) VALUES (%s, %s, %s)",
                    (cID, date, amount)
                )

                return jsonify({
                    "message": f"지점 {cID}에 기록이 성공적으로 추가되었습니다.",
                    "record": {"cID": cID, "date": date, "amount": amount}
                }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 북마크 추가 엔드포인트
@app.route('/home/bookmark', methods=['POST'])
def add_bookmark():
    try:
        # 요청 데이터에서 필요한 값 가져오기
        if 'user' not in session:
            return jsonify({"error": "로그인이 필요합니다."}), 401

        email = session['user']
        data = request.json
        cID = data.get('cid')

        # 데이터 유효성 검사
        if not cID:
            return jsonify({"error": "cID가 필요합니다."}), 400

        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 가져오기
                cursor.execute("SELECT uID FROM user_info WHERE email = %s", (email,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404
                user_id = user[0]

                # 이미 북마크된 포인트인지 확인
                cursor.execute(
                    "SELECT 1 FROM user_marker WHERE uID = %s AND cID = %s",
                    (user_id, cID)
                )
                if cursor.fetchone():
                    return jsonify({"error": "이미 북마크된 포인트입니다."}), 409

                # 북마크 추가
                cursor.execute(
                    "INSERT INTO user_marker (uID, cID) VALUES (%s, %s)",
                    (user_id, cID)
                )

                return jsonify({"message": f"지점 {cID}이 북마크에 추가되었습니다."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/home/group/markers', methods=['GET'])
def get_group_markers():
    if 'user' not in session:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    email = session['user']
    group_id = request.args.get('groupID')

    if not group_id:
        return jsonify({"error": "groupID가 필요합니다."}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 확인
                cursor.execute(
                    """
                    SELECT 1 FROM user_groups 
                    WHERE groupID = %s AND uID = (SELECT uID FROM user_info WHERE email = %s)
                    """,
                    (group_id, email)
                )
                if not cursor.fetchone():
                    return jsonify({"error": "사용자의 그룹이 아니거나 그룹이 존재하지 않습니다."}), 403

                # 그룹 내 마커 조회
                cursor.execute(
                    """
                    SELECT cb.cID, cb.latitude, cb.longitude 
                    FROM group_markers gm
                    INNER JOIN clothing_box cb ON gm.cID = cb.cID
                    WHERE gm.groupID = %s
                    """,
                    (group_id,)
                )
                markers = cursor.fetchall()

                return jsonify({
                    "groupID": group_id,
                    "markers": [
                        {"cID": marker[0], "latitude": marker[1], "longitude": marker[2]} 
                        for marker in markers
                    ]
                }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/home/group', methods=['POST'])
def create_group():
    if 'user' not in session:
        return jsonify({"error": "로그인이 필요합니다."}), 401

    email = session['user']
    data = request.json
    group_name = data.get('groupName')

    if not group_name:
        return jsonify({"error": "groupName이 필요합니다."}), 400

    try:
        conn = get_db_connection()
        with conn:
            with conn.cursor() as cursor:
                # 사용자 ID 가져오기
                cursor.execute("SELECT uID FROM user_info WHERE email = %s", (email,))
                user = cursor.fetchone()
                if not user:
                    return jsonify({"error": "사용자를 찾을 수 없습니다."}), 404
                user_id = user[0]

                # 그룹 생성
                cursor.execute(
                    "INSERT INTO user_groups (groupName, uID) VALUES (%s, %s) RETURNING groupID",
                    (group_name, user_id)
                )
                group_id = cursor.fetchone()[0]

                return jsonify({"message": "그룹이 생성되었습니다.", "groupID": group_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)