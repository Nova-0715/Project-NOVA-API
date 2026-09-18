module.exports = async (req, res) => {
  const apiKey = process.env.MOLIT_API_KEY;
  const REGIONS = [
    { code: '11110', name: '종로구' }, { code: '11140', name: '중구' },
    { code: '11170', name: '용산구' }, { code: '11200', name: '성동구' },
    { code: '11215', name: '광진구' }, { code: '11230', name: '동대문구' },
    { code: '11260', name: '중랑구' }, { code: '11290', name: '성북구' },
    { code: '11305', name: '강북구' }, { code: '11320', name: '도봉구' },
    { code: '11350', name: '노원구' }, { code: '11380', name: '은평구' },
    { code: '11410', name: '서대문구' }, { code: '11440', name: '마포구' },
    { code: '11470', name: '양천구' }, { code: '11500', name: '강서구' },
    { code: '11530', name: '구로구' }, { code: '11545', name: '금천구' },
    { code: '11560', name: '영등포구' }, { code: '11590', name: '동작구' },
    { code: '11620', name: '관악구' }, { code: '11650', name: '서초구' },
    { code: '11680', name: '강남구' }, { code: '11710', name: '송파구' },
    { code: '11740', name: '강동구' },
  ];

  // "202609" -> "202608" 처럼 한 달 전 연월을 계산
  function prevYm(ym) {
    const y = parseInt(ym.slice(0, 4), 10);
    const m = parseInt(ym.slice(4, 6), 10);
    const d = new Date(y, m - 2, 1); // m-1 = 이번달 index, 한 달 더 빼서 지난달
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  async function fetchRegionMonth(region, ym) {
    const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${apiKey}&LAWD_CD=${region.code}&DEAL_YMD=${ym}&numOfRows=100&pageNo=1&_type=json`;
    try {
      const r = await fetch(url);
      const data = await r.json();
      let items = data?.response?.body?.items?.item || [];
      if (!Array.isArray(items)) items = [items];
      return items.map((it) => ({
        region: `서울 ${region.name}`,
        dong: it.umdNm,
        apt: it.aptNm,
        area: Number(it.excluUseAr),
        floor: it.floor,
        price: Number(String(it.dealAmount).replace(/,/g, '').trim()),
        date: `${it.dealYear}.${String(it.dealMonth).padStart(2, '0')}.${String(it.dealDay).padStart(2, '0')}`,
      }));
    } catch (e) {
      return [];
    }
  }

  async function fetchAllRegions(ym) {
    const results = await Promise.all(REGIONS.map((region) => fetchRegionMonth(region, ym)));
    return results.flat();
  }

  const now = new Date();
  const ymParam = req.query.ym;
  const currentYm = ymParam || `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    let all = await fetchAllRegions(currentYm);
    const ymsUsed = [currentYm];

    // ym을 직접 지정한 게 아니고, 이번 달 데이터가 20건이 안 되면 지난달 것도 채워온다
    if (!ymParam && all.length < 20) {
      const pYm = prevYm(currentYm);
      const prevItems = await fetchAllRegions(pYm);
      all = all.concat(prevItems);
      ymsUsed.push(pYm);
    }

    all.sort((a, b) => b.date.localeCompare(a.date));
    all = all.slice(0, 20);

    res.status(200).json({ yms: ymsUsed, count: all.length, items: all });
  } catch (e) {
    res.status(500).json({ error: '데이터를 불러오지 못했습니다' });
  }
};
