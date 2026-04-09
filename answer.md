# SQL 실습 정답

## DDL 실습

### 문제 1: 테이블 생성하기 (CREATE TABLE)

**생각해보기 - 중복된 데이터는 어떤 컬럼인가?**
`crew_id`와 `nickname` 컬럼이다. 같은 크루가 출석할 때마다 동일한 `crew_id`와 `nickname` 쌍이 반복해서 삽입된다. 예를 들어 검프(crew_id=1)가 7일 출석하면 `(1, '검프')` 쌍이 7번 중복 저장된다.

**생각해보기 - crew 테이블은 어떻게 구성할 수 있을까?**
크루의 고유 식별자인 `crew_id`(PK)와 `nickname` 두 컬럼으로 구성한다.

```sql
-- 1. 크루 정보 추출 (DISTINCT로 중복 제거)
SELECT DISTINCT crew_id, nickname
FROM attendance
ORDER BY crew_id;

-- 2. crew 테이블 생성
CREATE TABLE crew (
  crew_id  INT          NOT NULL,
  nickname VARCHAR(50)  NOT NULL,
  PRIMARY KEY (crew_id)
);

-- 3. attendance에서 크루 정보를 추출해서 crew 테이블에 삽입
INSERT INTO crew (crew_id, nickname)
SELECT DISTINCT crew_id, nickname
FROM attendance
ORDER BY crew_id;
```

---

### 문제 2: 테이블 컬럼 삭제하기 (ALTER TABLE)

**생각해보기 - 불필요해지는 컬럼은?**
`nickname` 컬럼이다. 크루 정보는 crew 테이블에서 `crew_id`를 통해 조회할 수 있으므로 attendance 테이블에서 nickname을 별도로 저장할 필요가 없다.

```sql
ALTER TABLE attendance
DROP COLUMN nickname;
```

---

### 문제 3: 외래키 설정하기

**생각해보기 - 잠재적인 문제는?**
attendance 테이블에 crew 테이블에 존재하지 않는 `crew_id`가 들어올 수 있다. 외래키(FK) 제약을 걸면 crew 테이블에 없는 `crew_id`는 attendance에 삽입되지 않고, crew에서 레코드가 삭제될 때도 참조 무결성이 보호된다.

```sql
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_crew
  FOREIGN KEY (crew_id)
  REFERENCES crew (crew_id);
```

---

### 문제 4: 유니크 키 설정

**생각해보기 - crew 테이블의 결함은?**
현재 crew 테이블에는 동일한 nickname이 여러 번 삽입될 수 있다. 우아한테크코스에서 닉네임 중복이 금지되므로, UNIQUE 제약으로 DB 레벨에서도 중복을 방지해야 한다.

```sql
ALTER TABLE crew
ADD CONSTRAINT uq_crew_nickname
  UNIQUE (nickname);
```

---

## DML 실습

### 문제 5: 크루 닉네임 검색하기 (LIKE)

3월 4일에 등교한 크루 중 닉네임 첫 글자가 '디'인 크루를 찾는다.

```sql
-- crew 테이블 분리 전 (nickname 컬럼이 attendance에 있는 경우)
SELECT *
FROM attendance
WHERE attendance_date = '2025-03-04'
  AND nickname LIKE '디%';

-- crew 테이블 분리 후
SELECT c.nickname, a.attendance_date, a.start_time, a.end_time
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE a.attendance_date = '2025-03-04'
  AND c.nickname LIKE '디%';
```

> 결과: **디노** (crew_id=11, 2025-03-04 09:59 등교)

---

### 문제 6: 출석 기록 확인하기 (SELECT + WHERE)

어셔의 3월 6일 출석 기록이 있는지 확인한다.

```sql
-- crew 테이블 분리 전
SELECT *
FROM attendance
WHERE nickname = '어셔'
  AND attendance_date = '2025-03-06';

-- crew 테이블 분리 후
SELECT *
FROM attendance
WHERE crew_id = (SELECT crew_id FROM crew WHERE nickname = '어셔')
  AND attendance_date = '2025-03-06';
```

> 결과: 레코드가 없음 → 출석 기록이 누락된 것이 확인된다.

---

### 문제 7: 누락된 출석 기록 추가 (INSERT)

어셔의 crew 정보를 먼저 추가한 뒤 출석 기록을 삽입한다.

```sql
-- crew 테이블에 어셔 추가 (crew_id는 기존 최댓값 이후로 배정)
INSERT INTO crew (crew_id, nickname)
VALUES (13, '어셔');

-- 출석 기록 추가
INSERT INTO attendance (crew_id, attendance_date, start_time, end_time)
VALUES (13, '2025-03-06', '09:31', '18:01');
```

---

### 문제 8: 잘못된 출석 기록 수정 (UPDATE)

주니의 3월 12일 start_time을 10:05 → 10:00으로 수정한다.

```sql
UPDATE attendance
SET start_time = '10:00'
WHERE crew_id = (SELECT crew_id FROM crew WHERE nickname = '주니')
  AND attendance_date = '2025-03-12';
```

---

### 문제 9: 허위 출석 기록 삭제 (DELETE)

아론의 3월 12일 출석 기록을 삭제한다.

```sql
DELETE FROM attendance
WHERE crew_id = (SELECT crew_id FROM crew WHERE nickname = '아론')
  AND attendance_date = '2025-03-12';
```

---

### 문제 10: 출석 정보 조회하기 (JOIN)

crew 테이블과 JOIN하여 nickname과 함께 출석 기록을 조회한다.

```sql
SELECT c.nickname, a.attendance_date, a.start_time, a.end_time
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE c.nickname = '검프'
ORDER BY a.attendance_date;
```

---

### 문제 11: nickname으로 쿼리 처리하기 (서브 쿼리)

서브쿼리로 nickname → crew_id를 변환해서 조회한다.

```sql
SELECT *
FROM attendance
WHERE crew_id = (
  SELECT crew_id
  FROM crew
  WHERE nickname = '검프'
)
ORDER BY attendance_date;
```

---

### 문제 12: 가장 늦게 하교한 크루 찾기

3월 5일에 end_time이 가장 늦은 크루의 nickname과 하교 시각을 찾는다.

```sql
SELECT c.nickname, a.end_time
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
WHERE a.attendance_date = '2025-03-05'
  AND a.end_time = (
    SELECT MAX(end_time)
    FROM attendance
    WHERE attendance_date = '2025-03-05'
  );
```

> 결과: **네오**, 18:15

---

## 집계 함수 실습

### 문제 13: 크루별로 '기록된' 날짜 수 조회

```sql
SELECT c.nickname, COUNT(*) AS attendance_count
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
GROUP BY a.crew_id, c.nickname
ORDER BY a.crew_id;
```

---

### 문제 14: 크루별로 등교 기록이 있는(start_time IS NOT NULL) 날짜 수 조회

`COUNT(컬럼명)`은 NULL을 제외하고 카운트한다.

```sql
SELECT c.nickname, COUNT(a.start_time) AS checkin_count
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
GROUP BY a.crew_id, c.nickname
ORDER BY a.crew_id;
```

---

### 문제 15: 날짜별로 등교한 크루 수 조회

```sql
SELECT attendance_date, COUNT(*) AS crew_count
FROM attendance
GROUP BY attendance_date
ORDER BY attendance_date;
```

---

### 문제 16: 크루별 가장 빠른 등교 시각(MIN)과 가장 늦은 등교 시각(MAX)

```sql
SELECT c.nickname,
       MIN(a.start_time) AS earliest_checkin,
       MAX(a.start_time) AS latest_checkin
FROM attendance a
JOIN crew c ON a.crew_id = c.crew_id
GROUP BY a.crew_id, c.nickname
ORDER BY a.crew_id;
```
