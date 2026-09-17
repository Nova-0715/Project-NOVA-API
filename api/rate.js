module.exports = async (req, res) => {
  const apiKey = process.env.ECOS_API_KEY;
  const statCode = '722Y001';   // 한국은행 기준금리 통계표
  const itemCode = '0101000';   // 그 중 "기준금리" 항목
  const cycle = 'D';            // 일별

  const today = new Date();
  const end = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start = startDate.toISOString().slice(0, 10).replace(/-/g, '');

  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/10/${statCode}/${cycle}/${start}/${end}/${itemCode}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    const rows = data?.StatisticSearch?.row || [];
    const latest = rows[rows.length - 1];

    res.status(200).json({
      value: latest ? Number(latest.DATA_VALUE) : null,
      date: latest ? latest.TIME : null,
    });
  } catch (e) {
    res.status(500).json({ error: '데이터를 불러오지 못했습니다' });
  }
};
