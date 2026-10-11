// 金融行业草案；分类与信源须由站点运营者确认后上线。
export const CATEGORIES = [
  { key: "a-shares", label: "A 股", section: "A 股市场", guide: "沪深北交易所上市公司、指数、财报、并购、回购、分红及交易变化；影响全市场的货币政策归宏观。" },
  { key: "hk-stocks", label: "港股", section: "港股市场", guide: "香港上市公司、恒生指数、港股通与上市交易变化；A/H 同一公告按主要交易市场分类并保留双市场标签。" },
  { key: "us-stocks", label: "美股", section: "美股市场", guide: "美国上市公司、主要美股指数、财报与重大交易；利率决议归宏观。" },
  { key: "gold", label: "黄金", section: "全球黄金", guide: "全球黄金现货、期货、黄金 ETF、央行购金、矿业供需与实物黄金；金饰促销和无市场事实的销售稿不属于市场新闻。" },
  { key: "industry", label: "宏观政策", section: "宏观政策", guide: "央行利率、通胀、就业、汇率、监管与地缘事件，须与股票或黄金市场有明确联系。" },
  { key: "tip", label: "市场知识", section: "市场解读", guide: "可复用的财报、估值、交易制度和风险知识，不能写成个股买卖建议。", commentary: true },
  { key: "opinion", label: "市场解读", section: "市场解读", guide: "有证据的市场判断、复盘与研究解释，区分作者预测和已发生事实。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;
export const RELEASE: { category: string; tag: string; unit: string } | null = null;
export const PLAIN_TERMS: readonly string[] = ["a股", "港股", "美股", "黄金", "etf", "ipo", "cpi", "pce", "gdp", "eps", "美元", "人民币", "利率", "基点"];
export const ITEM_TYPES = ["market_move", "financial_product", "research_method", "research_report", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;
export const CATEGORY_TAGS = ["行情异动", "财报公告", "重大交易", "政策/监管", "宏观数据", "产品更新", "研究报告", "教程/实践", "市场观点", "供需变化", "行业动态", "其他"] as const;
export const TOPIC_TAGS = ["A股", "港股", "美股", "黄金", "黄金ETF", "央行购金", "现货黄金", "黄金期货", "利率", "通胀", "就业", "美元", "财报", "并购", "回购", "分红", "IPO", "资金流向"] as const;
export const ENTITY_TAGS = ["中国人民银行", "美联储", "香港交易所", "上海证券交易所", "深圳证券交易所", "上海黄金交易所", "美国证监会", "中国证监会", "世界黄金协会", "Alphabet", "Meta", "Microsoft", "NVIDIA", "阿里巴巴", "腾讯", "Apple", "Amazon", "AMD"] as const;
export const TAG_SYNONYMS: Readonly<Record<string,string>> = {"A 股": "A股", "香港股市": "港股", "美国股市": "美股", "金价": "行情异动", "观点": "市场观点", "研报": "研究报告", "监管": "政策/监管", "政策": "政策/监管", "收购": "重大交易", "开源": "产品更新"};
export const ENTITIES: Record<string,{name:string;displayTag:string|null;aliases:string[];otherNames?:string[]}> = {"pboc": {"name": "中国人民银行", "displayTag": "中国人民银行", "aliases": ["中国人民银行", "央行", "PBOC"]}, "fed": {"name": "美联储", "displayTag": "美联储", "aliases": ["美联储", "Federal Reserve", "Fed", "FOMC"]}, "hkex": {"name": "香港交易所", "displayTag": "香港交易所", "aliases": ["香港交易所", "港交所", "HKEX"]}, "sse": {"name": "上海证券交易所", "displayTag": "上海证券交易所", "aliases": ["上海证券交易所", "上交所", "SSE"]}, "szse": {"name": "深圳证券交易所", "displayTag": "深圳证券交易所", "aliases": ["深圳证券交易所", "深交所", "SZSE"]}, "sge": {"name": "上海黄金交易所", "displayTag": "上海黄金交易所", "aliases": ["上海黄金交易所", "上金所", "SGE"]}, "sec": {"name": "美国证监会", "displayTag": "美国证监会", "aliases": ["SEC", "美国证监会"]}, "csrc": {"name": "中国证监会", "displayTag": "中国证监会", "aliases": ["中国证监会", "CSRC"]}, "wgc": {"name": "世界黄金协会", "displayTag": "世界黄金协会", "aliases": ["世界黄金协会", "World Gold Council", "WGC"]}, "google": {"name": "Alphabet", "displayTag": "Alphabet", "aliases": ["Alphabet", "Google", "谷歌", "GOOGL"]}, "meta": {"name": "Meta", "displayTag": "Meta", "aliases": ["Meta", "META"]}, "microsoft": {"name": "Microsoft", "displayTag": "Microsoft", "aliases": ["Microsoft", "微软", "MSFT"]}, "nvidia": {"name": "NVIDIA", "displayTag": "NVIDIA", "aliases": ["NVIDIA", "英伟达", "NVDA"]}, "alibaba": {"name": "阿里巴巴", "displayTag": "阿里巴巴", "aliases": ["阿里巴巴", "Alibaba", "BABA"]}, "tencent": {"name": "腾讯", "displayTag": "腾讯", "aliases": ["腾讯", "Tencent"]}, "apple": {"name": "Apple", "displayTag": "Apple", "aliases": ["Apple", "苹果", "AAPL"]}, "amazon": {"name": "Amazon", "displayTag": "Amazon", "aliases": ["Amazon", "亚马逊", "AMZN"]}, "amd": {"name": "AMD", "displayTag": "AMD", "aliases": ["AMD", "Advanced Micro Devices"]}};
export const IDENTITY_LEXICON: ReadonlyArray<{id:string;name:string;patterns:RegExp[]}> = [
  { id: "pboc", name: "中国人民银行", patterns: [/中国人民银行|\bPBOC\b/i] },
  { id: "fed", name: "美联储", patterns: [/美联储|\bFederal\ Reserve\b|\bFed\b|\bFOMC\b/i] },
  { id: "hkex", name: "香港交易所", patterns: [/香港交易所|港交所|\bHKEX\b/i] },
  { id: "sse", name: "上海证券交易所", patterns: [/上海证券交易所|上交所|\bSSE\b/i] },
  { id: "szse", name: "深圳证券交易所", patterns: [/深圳证券交易所|深交所|\bSZSE\b/i] },
  { id: "sge", name: "上海黄金交易所", patterns: [/上海黄金交易所|上金所|\bSGE\b/i] },
  { id: "sec", name: "美国证监会", patterns: [/\bSEC\b|美国证监会/i] },
  { id: "csrc", name: "中国证监会", patterns: [/中国证监会|\bCSRC\b/i] },
  { id: "wgc", name: "世界黄金协会", patterns: [/世界黄金协会|\bWorld\ Gold\ Council\b|\bWGC\b/i] },
  { id: "google", name: "Alphabet", patterns: [/\bAlphabet\b|\bGoogle\b|谷歌|\bGOOGL\b/i] },
  { id: "meta", name: "Meta", patterns: [/\bMeta\b|\bMETA\b/i] },
  { id: "microsoft", name: "Microsoft", patterns: [/\bMicrosoft\b|微软|\bMSFT\b/i] },
  { id: "nvidia", name: "NVIDIA", patterns: [/\bNVIDIA\b|英伟达|\bNVDA\b/i] },
  { id: "alibaba", name: "阿里巴巴", patterns: [/阿里巴巴|\bAlibaba\b|\bBABA\b/i] },
  { id: "tencent", name: "腾讯", patterns: [/腾讯|\bTencent\b/i] },
  { id: "apple", name: "Apple", patterns: [/\bApple\b|苹果|\bAAPL\b/i] },
  { id: "amazon", name: "Amazon", patterns: [/\bAmazon\b|亚马逊|\bAMZN\b/i] },
  { id: "amd", name: "AMD", patterns: [/\bAMD\b|\bAdvanced\ Micro\ Devices\b/i] },
];
export const PUBLISHER_DOMAINS: ReadonlyArray<{entityId:string;domains:readonly string[]}> = [{"entityId": "pboc", "domains": ["pbc.gov.cn"]}, {"entityId": "fed", "domains": ["federalreserve.gov"]}, {"entityId": "sge", "domains": ["sge.com.cn"]}, {"entityId": "hkex", "domains": ["hkex.com.hk"]}, {"entityId": "sec", "domains": ["sec.gov"]}, {"entityId": "sse", "domains": ["sse.com.cn"]}, {"entityId": "szse", "domains": ["szse.cn"]}, {"entityId": "csrc", "domains": ["csrc.gov.cn"]}, {"entityId": "wgc", "domains": ["gold.org"]}, {"entityId": "google", "domains": ["abc.xyz", "blog.google"]}, {"entityId": "microsoft", "domains": ["microsoft.com"]}, {"entityId": "nvidia", "domains": ["nvidia.com"]}, {"entityId": "meta", "domains": ["about.fb.com"]}];
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{entityId:string;pattern:RegExp}> = [];
