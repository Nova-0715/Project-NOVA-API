module.exports = async (req, res) => {
  const apiKey = process.env.MOLIT_API_KEY;
  const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade?serviceKey=${apiKey}&LAWD_CD=11680&DEAL_YMD=202608&numOfRows=10&pageNo=1&_type=json`;

  try {
    const r = await fetch(url);
    const text = await r.text();
    res.status(200).json({
      httpStatus: r.status,
      keyLength: apiKey ? apiKey.length : 0,
      rawResponse: text.slice(0, 1000),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
