export const starts = [
  { id: "gangnam", name: "강남역", x: "127.027621", y: "37.497942" },
  { id: "hongdae", name: "홍대입구역", x: "126.923778", y: "37.556799" },
  { id: "jamsil", name: "잠실역", x: "127.100159", y: "37.513262" },
  { id: "sadang", name: "사당역", x: "126.981558", y: "37.476559" },
  { id: "suwon", name: "수원역", x: "127.000092", y: "37.266229" },
  { id: "incheon", name: "인천역", x: "126.616936", y: "37.476691" },
  { id: "uijeongbu", name: "의정부역", x: "127.047729", y: "37.738415" },
  { id: "pangyo", name: "판교역", x: "127.111153", y: "37.394761" },
  { id: "gimpo-airport", name: "김포공항역", x: "126.801904", y: "37.562434" },
  { id: "daehwa", name: "대화역", x: "126.747206", y: "37.676087" },
];

export const ends = [
  { id: "seoul", name: "서울역", x: "126.970663", y: "37.554648" },
  { id: "jongno3", name: "종로3가역", x: "126.992153", y: "37.571607" },
  { id: "seongsu", name: "성수역", x: "127.055961", y: "37.544581" },
  { id: "yeouido", name: "여의도역", x: "126.924030", y: "37.521624" },
  { id: "gwanghwamun", name: "광화문역", x: "126.976407", y: "37.571525" },
  { id: "konkuk", name: "건대입구역", x: "127.069202", y: "37.540408" },
  { id: "sindorim", name: "신도림역", x: "126.891124", y: "37.508725" },
  { id: "express-bus", name: "고속터미널역", x: "127.004846", y: "37.504810" },
  { id: "wangsimni", name: "왕십리역", x: "127.037102", y: "37.561533" },
  { id: "hapjeong", name: "합정역", x: "126.914522", y: "37.549913" },
];

const matrixCase = (id, startCount, endCount, description) => ({
  id,
  description,
  starts: starts.slice(0, startCount),
  ends: ends.slice(0, endCount),
});

export const experimentCases = {
  "1x1": matrixCase("1x1", 1, 1, "단일 요청 기준선"),
  "2x2": matrixCase("2x2", 2, 2, "소규모 다대다"),
  "3x3": matrixCase("3x3", 3, 3, "일반 사용 규모"),
  "4x4": matrixCase("4x4", 4, 4, "배포 예비 측정 재현"),
  "5x5": matrixCase("5x5", 5, 5, "중간 부하 정사각형"),
  "6x6": matrixCase("6x6", 6, 6, "대용량 진입 검증"),
  "8x8": matrixCase("8x8", 8, 8, "대용량 정사각형"),
  "10x10": matrixCase("10x10", 10, 10, "최대 계획 정사각형"),
  "1x10": matrixCase("1x10", 1, 10, "목적지 편향"),
  "10x1": matrixCase("10x1", 10, 1, "출발지 편향"),
  "2x10": matrixCase("2x10", 2, 10, "큰 목적지 편향"),
  "10x2": matrixCase("10x2", 10, 2, "큰 출발지 편향"),
  identical: {
    id: "identical",
    description: "동일 좌표",
    starts: [starts[0]],
    ends: [{ ...starts[0], id: "gangnam-destination" }],
  },
  nearby: {
    id: "nearby",
    description: "700m 이내",
    starts: [starts[0]],
    ends: [{ id: "gangnam-nearby", name: "강남역 인근", x: "127.029050", y: "37.499120" }],
  },
};
