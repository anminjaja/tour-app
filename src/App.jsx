import React, { useState, useEffect } from "react";
import { ref, set, get, child } from "firebase/database";
import { db } from "./firebase";
import "./App.css";

const TOUR_API_KEY = "bd21b12db0e288c3985b09ce34dad04c43e57ea2693be743697926278f106d4d";

const REGIONS = [
  { code: "1", name: "서울" },
  { code: "2", name: "인천" },
  { code: "3", name: "대전" },
  { code: "4", name: "대구" },
  { code: "5", name: "광주" },
  { code: "6", name: "부산" },
  { code: "7", name: "울산" },
  { code: "8", name: "세종특별자치시" },
  { code: "31", name: "경기도" },
  { code: "32", name: "강원특별자치도" },
  { code: "39", name: "제주도" }
];

export default function App() {
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedAreaName, setSelectedAreaName] = useState("");
  const [tourList, setTourList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSection, setShowSection] = useState(false);

  // 1. 공공데이터포털 TourAPI 호출
  const fetchTourData = async (areaCode) => {
    setLoading(true);
    const endpoint = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
    const params = new URLSearchParams({
      serviceKey: TOUR_API_KEY,
      numOfRows: "12",
      pageNo: "1",
      MobileOS: "ETC",
      MobileApp: "TourApp",
      _type: "json",
      areaCode: areaCode,
      arrange: "Q"
    });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) throw new Error("API 응답 실패");
      const data = await response.json();
      const items = data.response?.body?.items?.item;

      if (Array.isArray(items)) {
        setTourList(items);
      } else if (items) {
        setTourList([items]);
      } else {
        setTourList([]);
      }
      setShowSection(true);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      setTourList([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Firebase Realtime Database 저장
  const saveRegionToFirebase = async (areaCode, areaName) => {
    try {
      await set(ref(db, "userActivity/selectedRegion"), {
        areaCode: areaCode,
        areaName: areaName,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firebase 저장 실패:", err);
    }
  };

  // 3. 첫 진입 시 저장된 데이터 복원
  useEffect(() => {
    const initData = async () => {
      try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "userActivity/selectedRegion"));

        if (snapshot.exists()) {
          const savedData = snapshot.val();
          setSelectedArea(savedData.areaCode);
          setSelectedAreaName(savedData.areaName);
          fetchTourData(savedData.areaCode);
        } else {
          setShowSection(false);
        }
      } catch (err) {
        console.error("초기 데이터 복원 실패:", err);
        setShowSection(false);
      }
    };

    initData();
  }, []);

  // 4. 지역 선택 변경 핸들러
  const handleAreaChange = (e) => {
    const code = e.target.value;
    const regionObj = REGIONS.find((r) => r.code === code);

    if (!code) {
      setSelectedArea("");
      setSelectedAreaName("");
      setShowSection(false);
      return;
    }

    const name = regionObj ? regionObj.name : "";
    setSelectedArea(code);
    setSelectedAreaName(name);

    saveRegionToFirebase(code, name);
    fetchTourData(code);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>지역별 관광명소 탐색</h1>
        <p>선택하신 지역 정보는 자동으로 동기화되어 저장됩니다.</p>

        <div className="select-box-wrap">
          <label htmlFor="areaSelect">지역 선택: </label>
          <select id="areaSelect" value={selectedArea} onChange={handleAreaChange} className="area-select">
            <option value="">-- 지역을 선택하세요 --</option>
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading && <p style={{ textAlign: "center", margin: "20px 0" }}>관광지 정보를 불러오는 중입니다...</p>}

      {showSection && !loading && (
        <main className="content-area">
          <h2 className="section-title">📍 {selectedAreaName} 관광지 추천</h2>
          <div className="grid-container">
            {tourList.length === 0 ? (
              <p style={{ gridColumn: "1/-1", textAlign: "center" }}>등록된 관광 정보가 없습니다.</p>
            ) : (
              tourList.map((item, idx) => (
                <div key={item.contentid || idx} className="card">
                  <div className="image-wrapper">
                    <img
                      src={item.firstimage || item.firstimage2 || "https://placehold.co/400x250?text=No+Image"}
                      alt={item.title}
                      loading="lazy"
                      className="card-image"
                    />
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-address">{item.addr1 || "주소 정보 없음"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      )}
    </div>
  );
}