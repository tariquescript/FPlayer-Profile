/**
 * Country name -> ISO 3166-1 alpha-2, for flag images. Covers the nations that
 * actually turn up in Transfermarkt squads, including its own naming quirks
 * ("Korea, South", "Cote d'Ivoire"). Unknown names simply render without a flag.
 */
const CODES = {
  afghanistan: 'af', albania: 'al', algeria: 'dz', andorra: 'ad', angola: 'ao',
  'antigua and barbuda': 'ag', argentina: 'ar', armenia: 'am', aruba: 'aw',
  australia: 'au', austria: 'at', azerbaijan: 'az', bahrain: 'bh', bangladesh: 'bd',
  barbados: 'bb', belarus: 'by', belgium: 'be', belize: 'bz', benin: 'bj',
  bermuda: 'bm', bolivia: 'bo', 'bosnia-herzegovina': 'ba', 'bosnia and herzegovina': 'ba',
  botswana: 'bw', brazil: 'br', bulgaria: 'bg', 'burkina faso': 'bf', burundi: 'bi',
  cambodia: 'kh', cameroon: 'cm', canada: 'ca', 'cape verde': 'cv',
  'central african republic': 'cf', chad: 'td', chile: 'cl', china: 'cn',
  colombia: 'co', comoros: 'km', congo: 'cg', 'costa rica': 'cr', croatia: 'hr',
  cuba: 'cu', curacao: 'cw', cyprus: 'cy', 'czech republic': 'cz', czechia: 'cz',
  'cote d\'ivoire': 'ci', 'ivory coast': 'ci', denmark: 'dk', djibouti: 'dj',
  dominica: 'dm', 'dominican republic': 'do', 'dr congo': 'cd', ecuador: 'ec',
  egypt: 'eg', 'el salvador': 'sv', england: 'gb-eng', 'equatorial guinea': 'gq',
  eritrea: 'er', estonia: 'ee', eswatini: 'sz', ethiopia: 'et', 'faroe islands': 'fo',
  finland: 'fi', france: 'fr', gabon: 'ga', gambia: 'gm', georgia: 'ge',
  germany: 'de', ghana: 'gh', gibraltar: 'gi', greece: 'gr', grenada: 'gd',
  guadeloupe: 'gp', guatemala: 'gt', guinea: 'gn', 'guinea-bissau': 'gw', guyana: 'gy',
  haiti: 'ht', honduras: 'hn', 'hong kong': 'hk', hungary: 'hu', iceland: 'is',
  india: 'in', indonesia: 'id', iran: 'ir', iraq: 'iq', ireland: 'ie',
  israel: 'il', italy: 'it', jamaica: 'jm', japan: 'jp', jordan: 'jo',
  kazakhstan: 'kz', kenya: 'ke', kosovo: 'xk', kuwait: 'kw', kyrgyzstan: 'kg',
  latvia: 'lv', lebanon: 'lb', liberia: 'lr', libya: 'ly', liechtenstein: 'li',
  lithuania: 'lt', luxembourg: 'lu', madagascar: 'mg', malawi: 'mw', malaysia: 'my',
  mali: 'ml', malta: 'mt', martinique: 'mq', mauritania: 'mr', mauritius: 'mu',
  mexico: 'mx', moldova: 'md', montenegro: 'me', morocco: 'ma', mozambique: 'mz',
  myanmar: 'mm', namibia: 'na', nepal: 'np', netherlands: 'nl', 'new zealand': 'nz',
  nicaragua: 'ni', niger: 'ne', nigeria: 'ng', 'north macedonia': 'mk',
  'northern ireland': 'gb-nir', norway: 'no', oman: 'om', pakistan: 'pk',
  palestine: 'ps', panama: 'pa', paraguay: 'py', peru: 'pe', philippines: 'ph',
  poland: 'pl', portugal: 'pt', 'puerto rico': 'pr', qatar: 'qa', romania: 'ro',
  russia: 'ru', rwanda: 'rw', 'saudi arabia': 'sa', scotland: 'gb-sct', senegal: 'sn',
  serbia: 'rs', sierraleone: 'sl', 'sierra leone': 'sl', singapore: 'sg',
  slovakia: 'sk', slovenia: 'si', somalia: 'so', 'south africa': 'za',
  'south korea': 'kr', 'korea, south': 'kr', 'north korea': 'kp', 'korea, north': 'kp',
  'south sudan': 'ss', spain: 'es', 'sri lanka': 'lk', sudan: 'sd', suriname: 'sr',
  sweden: 'se', switzerland: 'ch', syria: 'sy', taiwan: 'tw', tajikistan: 'tj',
  tanzania: 'tz', thailand: 'th', togo: 'tg', 'trinidad and tobago': 'tt',
  tunisia: 'tn', turkey: 'tr', turkmenistan: 'tm', uganda: 'ug', ukraine: 'ua',
  'united arab emirates': 'ae', 'united states': 'us', usa: 'us', uruguay: 'uy',
  uzbekistan: 'uz', venezuela: 've', vietnam: 'vn', wales: 'gb-wls', yemen: 'ye',
  zambia: 'zm', zimbabwe: 'zw',
};

export function countryCode(name) {
  if (!name) return null;
  return CODES[name.trim().toLowerCase()] ?? null;
}

export function flagUrl(name, width = 40) {
  const code = countryCode(name);
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null;
}
