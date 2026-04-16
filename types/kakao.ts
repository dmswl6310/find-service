export interface KakaoLocation {
  id: string;             // 장소 ID
  place_name: string;     // 장소명
  address_name: string;   // 전체 지번 주소
  road_address_name: string; // 전체 도로명 주소
  x: string;              // X 좌표 혹은 경도(longitude)
  y: string;              // Y 좌표 혹은 위도(latitude)
}

export interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoLocation[];
}
