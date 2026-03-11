# Gymmate (gymmate)

# PRD
## Background / Problem
- 데이터 포인트 1: 타겟은 **20–30대 헬스장 이용자**로, 기록을 꾸준히 남기고 동기부여가 필요한 세그먼트다.
- 데이터 포인트 2: 대표 페르소나 민수는 **주 3–4회** 헬스장을 이용하지만 “기록이 귀찮다”는 이유로 기록 습관이 깨진다.

웨이트 트레이닝 기록은 세트/무게/반복 입력 부담이 커서 운동 중 즉시 기록하기 어렵다. 또한 기존 앱(삼성헬스/나이키런클럽 등)은 개인 기록 중심이라 친구와의 비교·공유·경쟁이 번거롭고, 헬스장 환경에서 네트워크가 불안정하면 사용이 끊겨 “운동 중 기록”이라는 핵심 순간을 놓친다.

## Goal (1-sentence product definition)
오프라인에서도 즉시 기록 가능한 운동 로그와 친구 챌린지를 제공하여 **출시 3개월 내 WAU 5,000명** 및 **프리미엄 전환율 5%**를 달성한다.

## Non-goals
- 식단 관리 기능
- PT 매칭 서비스
- 헬스장 예약/결제 기능
- 운동 영상 콘텐츠 제공
- 웨어러블 기기 연동
- 그룹 채팅 기능
- (모바일 MVP 제약) 푸시 알림/외부 결제(Toss/KakaoPay/Stripe) 연동

## Target Users (personas + use cases)
- **민수 (27, 직장인, 주 3–4회 헬스)**  
  - 페인 포인트: 운동 중 기록 입력이 번거로워 루틴이 끊김, 친구와 운동량 비교/경쟁이 불편함  
  - 사용 사례: “지난번 벤치 기록을 바로 보고 이번에는 중량/반복을 올려서 입력 → 주간 볼륨으로 친구와 비교”
- **지연 (24, 대학생, 다이어트 목적)**  
  - 페인 포인트: 혼자 하면 동기부여가 약함, 내 변화/진행을 시각적으로 보고 싶음  
  - 사용 사례: “친구 피드에서 인증/기록을 보고 자극 → 나도 오늘 운동을 빠르게 기록 → 주간 그래프로 성취 확인”

## Target Market
- 지역: **대한민국(South Korea)**
- 1차 타겟: 헬스장을 꾸준히 다니는 **20–30대**, 특히 친구와 함께 동기부여(경쟁/공유)를 원하는 사용자
- 포지셔닝: “오프라인에서도 끊김 없이 기록 + 친구와 함께 성장(피드/챌린지)하는 웨이트 기록 앱”

## Data Entities (nouns with key fields)
> `User`는 템플릿에 이미 존재하므로 제외

- **OnboardingProfile**
  - `goal` (strength | diet | maintain)
  - `heightCm` (number)
  - `weightKg` (number)
  - `createdAt` (ISO datetime)
- **WorkoutSession**
  - `id` (uuid)
  - `startedAt`, `endedAt` (ISO datetime)
  - `date` (YYYY-MM-DD)
  - `isCompleted` (boolean)
  - `totalVolumeKg` (number, 웨이트 합산)
  - `totalDurationSec` (number)
  - `syncStatus` (localOnly | pending | synced | error)
  - `updatedAt` (ISO datetime)
- **ExerciseEntry**
  - `id` (uuid)
  - `workoutSessionId` (uuid)
  - `name` (string; 예: Bench Press)
  - `category` (chest|back|leg|shoulder|arm|cardio|etc)
  - `type` (weight | cardio)
  - `note` (string, optional)
  - `order` (number)
- **SetEntry** (웨이트용)
  - `id` (uuid)
  - `exerciseEntryId` (uuid)
  - `setNumber` (number)
  - `weightKg` (number)
  - `reps` (number)
  - `completedAt` (ISO datetime)
  - `restPlannedSec` (number; 기본 60)
- **CardioEntry** (유산소용)
  - `id` (uuid)
  - `exerciseEntryId` (uuid)
  - `durationSec` (number)
  - `distanceKm` (number, optional)
- **PersonalRecord (PR)**
  - `id` (uuid)
  - `exerciseName` (string)
  - `prType` (maxWeight | maxReps | maxVolume)
  - `value` (number)
  - `achievedAt` (ISO datetime)
- **Friendship**
  - `id` (uuid)
  - `friendUserId` (uuid)
  - `status` (pending | accepted)
  - `createdAt` (ISO datetime)
- **FeedItem** (친구 피드의 단위)
  - `id` (uuid)
  - `workoutSessionId` (uuid)
  - `authorUserId` (uuid)
  - `summary` (string; 예: “벤치 + 스쿼트 총 볼륨 8,400kg”)
  - `createdAt` (ISO datetime)
- **FeedReaction (Like)**
  - `id` (uuid)
  - `feedItemId` (uuid)
  - `createdAt` (ISO datetime)
- **FeedComment**
  - `id` (uuid)
  - `feedItemId` (uuid)
  - `content` (string)
  - `createdAt` (ISO datetime)
- **Challenge**
  - `id` (uuid)
  - `title` (string)
  - `type` (days | volume)
  - `startDate`, `endDate` (YYYY-MM-DD)
  - `createdAt` (ISO datetime)
- **ChallengeParticipant**
  - `id` (uuid)
  - `challengeId` (uuid)
  - `participantUserId` (uuid)
  - `progressValue` (number; days=운동일수, volume=총볼륨)
  - `updatedAt` (ISO datetime)
- **SyncQueueItem** (오프라인 동기화용)
  - `id` (uuid)
  - `entityType` (WorkoutSession|ExerciseEntry|SetEntry|CardioEntry|FeedReaction|FeedComment|Challenge|Friendship)
  - `entityId` (uuid)
  - `operation` (upsert | delete)
  - `payload` (json)
  - `attemptCount` (number)
  - `lastAttemptAt` (ISO datetime, optional)

## Core Flow (numbered steps)
1. 사용자는 첫 실행 시 온보딩 모달에서 **목표(근력/다이어트/유지) + 키/몸무게**를 입력하고 저장한다.
2. Home(오늘의 운동)에서 **운동 시작**을 탭해 세션을 생성한다(오프라인 가능).
3. 종목 선택 화면에서 **종목 검색/선택** 후, 해당 종목의 **이전 기록(최근 세트/무게/반복)**을 확인한다.
4. Workout 화면에서 세트를 빠르게 입력하고, **세트 완료 시 휴식 타이머가 자동 시작**된다(앱 화면 내 표시 + 진동/사운드 옵션).
5. 운동 완료를 탭하면 세션이 완료 처리되고, **오프라인이면 로컬 저장 + 동기화 대기열**에 쌓인다(온라인 복귀 시 자동 동기화).
6. 사용자는 Stats에서 **주간 볼륨/PR 그래프**를 확인하고, Feed에서 친구 기록을 **스크롤 → 좋아요/댓글**하거나 **주간 챌린지 리더보드**에서 순위를 확인/참여한다.

## Success Metrics (measurable)
- **WAU 5,000명** (출시 후 3개월 내)
- 활성 유저 기준 **주당 평균 운동 기록 3회 이상**
- **친구 1명 이상 추가한 유저 비율 60%**
- **프리미엄 전환율 5%**
- **D7 리텐션 40% 이상**

## MVP Scope (exhaustive feature list)
- **빠른 운동 기록(웨이트/유산소)**
  - 웨이트: 세트/무게/반복 입력, 이전 기록 자동 표시
  - 유산소: 시간/거리 입력
- **오프라인 우선 저장 + 자동 동기화**
  - 로컬 즉시 저장, 네트워크 복구 시 SyncQueue 기반 재시도 동기화
  - 충돌 처리: 동일 엔티티는 `updatedAt` 최신 우선(서버 타임스탬프 기준)
- **친구 피드**
  - 친구의 운동 기록 타임라인 조회
  - 좋아요/댓글 작성(오프라인 작성 시 대기열 적재 후 동기화)
- **주간 챌린지**
  - 타입: 운동 일수(days) / 총 볼륨(volume)
  - 친구 초대 및 리더보드(참여자 진행도 표시)
- **기본 통계**
  - 주간 운동량(총 볼륨) 그래프
  - 종목별 PR 기록/추이
- **휴식 타이머(인앱)**
  - 세트 완료 시 자동 시작, 남은 시간 표시
  - 타이머 종료 시 **앱이 포그라운드일 때** 진동/사운드 제공(푸시 알림 제외)

### 모바일 스펙(필수 UX/인터랙션)
- **오프라인-퍼스트 동작 정의**
  - 기록/좋아요/댓글/챌린지 진행도 업데이트는 오프라인에서도 “완료”로 보이되 `syncStatus=pending` 배지 표시
  - Feed/Leaderboard는 마지막 성공 동기화 데이터를 표시하고 상단에 `마지막 동기화: {시간}` 표시
- **Pull-to-refresh 필요 화면**
  - Home(오늘의 운동 요약/진행중 세션 상태 갱신)
  - Feed(친구 피드 최신화)
  - 챌린지 리더보드(순위/진행도 최신화)
  - Stats(주간 집계/PR 최신화; 로컬 변경 시 즉시 반영 + 서버 동기화는 백그라운드)
- **제스처**
  - 세트(SetEntry) 행: **스와이프 삭제**(삭제 확인: “삭제” 버튼 탭 시에만 확정)
  - 운동 종목(ExerciseEntry) 카드: **롱프레스 → 순서 변경/이름 수정/메모 편집 메뉴**(MVP에선 순서 변경은 드래그 핸들로 제한 가능)
- **카메라/갤러리**
  - MVP 범위 아님(운동 인증샷/프로필 사진 촬영은 v2)

## Target Audience & Marketing
- 타겟: 헬스장 다니는 20–30대, “친구와 함께” 동기부여/경쟁을 원하는 사용자
- 핵심 메시지: **오프라인에서도 끊김 없이 기록 + 친구와 주간 대결**
- 채널(브리프 기반): KakaoTalk, Naver Blog, YouTube Korea
- 브랜드 톤: playful

## Monetization Strategy
- **freemium** (최적)  
  - 무료: 기본 운동 기록/오프라인 저장/친구 피드/주간 통계/기본 챌린지
  - 프리미엄: 무제한 챌린지, 상세 통계 등(구체 항목은 Open Questions에서 확정)  
  - 결제 방식: **App Store / Google Play 인앱 구독**(모바일 정책 준수). *(브리프의 Toss/KakaoPay/Stripe는 웹/향후 확장 시 고려)*

## Assumptions
1. 사용자는 헬스장 내 네트워크가 불안정한 상황을 자주 경험하며, 오프라인 기록이 핵심 가치로 작동한다.
2. “이전 기록 자동 표시”가 입력 시간을 유의미하게 줄여 주당 기록 횟수를 끌어올린다.
3. 친구 추가(1명 이상) 유저가 피드/챌린지 기능을 통해 리텐션이 더 높다.
4. 오프라인 작성(좋아요/댓글 포함)을 허용해도 동기화 지연이 UX를 크게 훼손하지 않는다.
5. 주간 챌린지 타입은 days/volume 두 가지로 MVP에서 충분하다.
6. 푸시 알림 없이도(인앱 타이머만으로도) 휴식 타이머의 효용이 성립한다.
7. 통계는 MVP에서 “주간 볼륨 + PR” 수준이면 초기 만족을 만든다.
8. React Native(Expo)에서 로컬 저장/동기화 큐 구현이 MVP 일정 내 가능하다.

## Open Questions
1. 프리미엄에서 “무료 대비 차별”의 최소 구성을 무엇으로 할지(예: 동시 챌린지 수 제한, 상세 통계 범위).
2. 챌린지 초대 방식의 MVP 우선순위: ID 검색 vs QR 코드 중 무엇을 먼저 제공할지.
3. “이전 기록”의 기준: 최근 1회 세션 기준 vs 최근 N회 평균/최고값 중 무엇을 노출할지.
4. 볼륨 계산 규칙: 웨이트는 `weightKg * reps` 합으로 고정할지, 머신/덤벨 등 변형을 허용할지.
5. 동기화 충돌 시 최신 우선 외에 사용자에게 충돌을 보여줘야 하는 케이스가 있는지(예: 동일 세션을 두 기기에서 편집).