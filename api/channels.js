// api/channels.js
const https = require('https');
const http  = require('http');

const REGIONS = [
  { id: 'af', name: 'Afghanistan', icon: '🇦🇫', url: 'https://iptv-org.github.io/iptv/countries/af.m3u' },
  { id: 'za', name: 'Afrique du Sud', icon: '🇿🇦', url: 'https://iptv-org.github.io/iptv/countries/za.m3u' },
  { id: 'al', name: 'Albanie', icon: '🇦🇱', url: 'https://iptv-org.github.io/iptv/countries/al.m3u' },
  { id: 'dz', name: 'Algérie', icon: '🇩🇿', url: 'https://iptv-org.github.io/iptv/countries/dz.m3u' },
  { id: 'de', name: 'Allemagne', icon: '🇩🇪', url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
  { id: 'ad', name: 'Andorre', icon: '🇦🇩', url: 'https://iptv-org.github.io/iptv/countries/ad.m3u' },
  { id: 'ao', name: 'Angola', icon: '🇦🇴', url: 'https://iptv-org.github.io/iptv/countries/ao.m3u' },
  { id: 'ai', name: 'Anguilla', icon: '🇦🇮', url: 'https://iptv-org.github.io/iptv/countries/ai.m3u' },
  { id: 'ag', name: 'Antigua-et-Barbuda', icon: '🇦🇬', url: 'https://iptv-org.github.io/iptv/countries/ag.m3u' },
  { id: 'sa', name: 'Arabie Saoudite', icon: '🇸🇦', url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
  { id: 'ar', name: 'Argentine', icon: '🇦🇷', url: 'https://iptv-org.github.io/iptv/countries/ar.m3u' },
  { id: 'am', name: 'Arménie', icon: '🇦🇲', url: 'https://iptv-org.github.io/iptv/countries/am.m3u' },
  { id: 'aw', name: 'Aruba', icon: '🇦🇼', url: 'https://iptv-org.github.io/iptv/countries/aw.m3u' },
  { id: 'au', name: 'Australie', icon: '🇦🇺', url: 'https://iptv-org.github.io/iptv/countries/au.m3u' },
  { id: 'at', name: 'Autriche', icon: '🇦🇹', url: 'https://iptv-org.github.io/iptv/countries/at.m3u' },
  { id: 'az', name: 'Azerbaïdjan', icon: '🇦🇿', url: 'https://iptv-org.github.io/iptv/countries/az.m3u' },
  { id: 'bs', name: 'Bahamas', icon: '🇧🇸', url: 'https://iptv-org.github.io/iptv/countries/bs.m3u' },
  { id: 'bh', name: 'Bahreïn', icon: '🇧🇭', url: 'https://iptv-org.github.io/iptv/countries/bh.m3u' },
  { id: 'bd', name: 'Bangladesh', icon: '🇧🇩', url: 'https://iptv-org.github.io/iptv/countries/bd.m3u' },
  { id: 'bb', name: 'Barbade', icon: '🇧🇧', url: 'https://iptv-org.github.io/iptv/countries/bb.m3u' },
  { id: 'be', name: 'Belgique', icon: '🇧🇪', url: 'https://iptv-org.github.io/iptv/countries/be.m3u' },
  { id: 'bz', name: 'Bélize', icon: '🇧🇿', url: 'https://iptv-org.github.io/iptv/countries/bz.m3u' },
  { id: 'bj', name: 'Bénin', icon: '🇧🇯', url: 'https://iptv-org.github.io/iptv/countries/bj.m3u' },
  { id: 'bm', name: 'Bermudes', icon: '🇧🇲', url: 'https://iptv-org.github.io/iptv/countries/bm.m3u' },
  { id: 'bt', name: 'Bhoutan', icon: '🇧🇹', url: 'https://iptv-org.github.io/iptv/countries/bt.m3u' },
  { id: 'by', name: 'Biélorussie', icon: '🇧🇾', url: 'https://iptv-org.github.io/iptv/countries/by.m3u' },
  { id: 'bo', name: 'Bolivie', icon: '🇧🇴', url: 'https://iptv-org.github.io/iptv/countries/bo.m3u' },
  { id: 'bq', name: 'Bonaire', icon: '🇧🇶', url: 'https://iptv-org.github.io/iptv/countries/bq.m3u' },
  { id: 'ba', name: 'Bosnie-Herzégovine', icon: '🇧🇦', url: 'https://iptv-org.github.io/iptv/countries/ba.m3u' },
  { id: 'bw', name: 'Botswana', icon: '🇧🇼', url: 'https://iptv-org.github.io/iptv/countries/bw.m3u' },
  { id: 'br', name: 'Brésil', icon: '🇧🇷', url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
  { id: 'bn', name: 'Brunei', icon: '🇧🇳', url: 'https://iptv-org.github.io/iptv/countries/bn.m3u' },
  { id: 'bg', name: 'Bulgarie', icon: '🇧🇬', url: 'https://iptv-org.github.io/iptv/countries/bg.m3u' },
  { id: 'bf', name: 'Burkina Faso', icon: '🇧🇫', url: 'https://iptv-org.github.io/iptv/countries/bf.m3u' },
  { id: 'bi', name: 'Burundi', icon: '🇧🇮', url: 'https://iptv-org.github.io/iptv/countries/bi.m3u' },
  { id: 'kh', name: 'Cambodge', icon: '🇰🇭', url: 'https://iptv-org.github.io/iptv/countries/kh.m3u' },
  { id: 'cm', name: 'Cameroun', icon: '🇨🇲', url: 'https://iptv-org.github.io/iptv/countries/cm.m3u' },
  { id: 'ca', name: 'Canada', icon: '🇨🇦', url: 'https://iptv-org.github.io/iptv/countries/ca.m3u' },
  { id: 'cv', name: 'Cap-Vert', icon: '🇨🇻', url: 'https://iptv-org.github.io/iptv/countries/cv.m3u' },
  { id: 'cf', name: 'République centrafricaine', icon: '🇨🇫', url: 'https://iptv-org.github.io/iptv/countries/cf.m3u' },
  { id: 'cl', name: 'Chili', icon: '🇨🇱', url: 'https://iptv-org.github.io/iptv/countries/cl.m3u' },
  { id: 'cn', name: 'Chine', icon: '🇨🇳', url: 'https://iptv-org.github.io/iptv/countries/cn.m3u' },
  { id: 'cy', name: 'Chypre', icon: '🇨🇾', url: 'https://iptv-org.github.io/iptv/countries/cy.m3u' },
  { id: 'co', name: 'Colombie', icon: '🇨🇴', url: 'https://iptv-org.github.io/iptv/countries/co.m3u' },
  { id: 'km', name: 'Comores', icon: '🇰🇲', url: 'https://iptv-org.github.io/iptv/countries/km.m3u' },
  { id: 'cg', name: 'République du Congo', icon: '🇨🇬', url: 'https://iptv-org.github.io/iptv/countries/cg.m3u' },
  { id: 'cd', name: 'République Démocratique du Congo', icon: '🇨🇩', url: 'https://iptv-org.github.io/iptv/countries/cd.m3u' },
  { id: 'kp', name: 'Corée du Nord', icon: '🇰🇵', url: 'https://iptv-org.github.io/iptv/countries/kp.m3u' },
  { id: 'kr', name: 'Corée du Sud', icon: '🇰🇷', url: 'https://iptv-org.github.io/iptv/countries/kr.m3u' },
  { id: 'cr', name: 'Costa Rica', icon: '🇨🇷', url: 'https://iptv-org.github.io/iptv/countries/cr.m3u' },
  { id: 'ci', name: "Côte d'Ivoire", icon: '🇨🇮', url: 'https://iptv-org.github.io/iptv/countries/ci.m3u' },
  { id: 'hr', name: 'Croatie', icon: '🇭🇷', url: 'https://iptv-org.github.io/iptv/countries/hr.m3u' },
  { id: 'cu', name: 'Cuba', icon: '🇨🇺', url: 'https://iptv-org.github.io/iptv/countries/cu.m3u' },
  { id: 'cw', name: 'Curacao', icon: '🇨🇼', url: 'https://iptv-org.github.io/iptv/countries/cw.m3u' },
  { id: 'dk', name: 'Danemark', icon: '🇩🇰', url: 'https://iptv-org.github.io/iptv/countries/dk.m3u' },
  { id: 'dj', name: 'Djibouti', icon: '🇩🇯', url: 'https://iptv-org.github.io/iptv/countries/dj.m3u' },
  { id: 'dm', name: 'Dominique', icon: '🇩🇲', url: 'https://iptv-org.github.io/iptv/countries/dm.m3u' },
  { id: 'do', name: 'République dominicaine', icon: '🇩🇴', url: 'https://iptv-org.github.io/iptv/countries/do.m3u' },
  { id: 'eg', name: 'Égypte', icon: '🇪🇬', url: 'https://iptv-org.github.io/iptv/countries/eg.m3u' },
  { id: 'ae', name: 'Émirats Arabes Unis', icon: '🇦🇪', url: 'https://iptv-org.github.io/iptv/countries/ae.m3u' },
  { id: 'ec', name: 'Équateur', icon: '🇪🇨', url: 'https://iptv-org.github.io/iptv/countries/ec.m3u' },
  { id: 'er', name: 'Érythrée', icon: '🇪🇷', url: 'https://iptv-org.github.io/iptv/countries/er.m3u' },
  { id: 'es', name: 'Espagne', icon: '🇪🇸', url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
  { id: 'ee', name: 'Estonie', icon: '🇪🇪', url: 'https://iptv-org.github.io/iptv/countries/ee.m3u' },
  { id: 'us', name: 'États-Unis', icon: '🇺🇸', url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
  { id: 'et', name: 'Éthiopie', icon: '🇪🇹', url: 'https://iptv-org.github.io/iptv/countries/et.m3u' },
  { id: 'fo', name: 'Îles Féroé', icon: '🇫🇴', url: 'https://iptv-org.github.io/iptv/countries/fo.m3u' },
  { id: 'fi', name: 'Finlande', icon: '🇫🇮', url: 'https://iptv-org.github.io/iptv/countries/fi.m3u' },
  { id: 'fr', name: 'France', icon: '🇫🇷', url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
  { id: 'ga', name: 'Gabon', icon: '🇬🇦', url: 'https://iptv-org.github.io/iptv/countries/ga.m3u' },
  { id: 'gm', name: 'Gambie', icon: '🇬🇲', url: 'https://iptv-org.github.io/iptv/countries/gm.m3u' },
  { id: 'ge', name: 'Géorgie', icon: '🇬🇪', url: 'https://iptv-org.github.io/iptv/countries/ge.m3u' },
  { id: 'gh', name: 'Ghana', icon: '🇬🇭', url: 'https://iptv-org.github.io/iptv/countries/gh.m3u' },
  { id: 'gr', name: 'Grèce', icon: '🇬🇷', url: 'https://iptv-org.github.io/iptv/countries/gr.m3u' },
  { id: 'gp', name: 'Guadeloupe', icon: '🇬🇵', url: 'https://iptv-org.github.io/iptv/countries/gp.m3u' },
  { id: 'gu', name: 'Guam', icon: '🇬🇺', url: 'https://iptv-org.github.io/iptv/countries/gu.m3u' },
  { id: 'gt', name: 'Guatemala', icon: '🇬🇹', url: 'https://iptv-org.github.io/iptv/countries/gt.m3u' },
  { id: 'gg', name: 'Guernesey', icon: '🇬🇬', url: 'https://iptv-org.github.io/iptv/countries/gg.m3u' },
  { id: 'gn', name: 'Guinée', icon: '🇬🇳', url: 'https://iptv-org.github.io/iptv/countries/gn.m3u' },
  { id: 'gq', name: 'Guinée Équatoriale', icon: '🇬🇶', url: 'https://iptv-org.github.io/iptv/countries/gq.m3u' },
  { id: 'gy', name: 'Guyane', icon: '🇬🇾', url: 'https://iptv-org.github.io/iptv/countries/gy.m3u' },
  { id: 'ht', name: 'Haïti', icon: '🇭🇹', url: 'https://iptv-org.github.io/iptv/countries/ht.m3u' },
  { id: 'hn', name: 'Honduras', icon: '🇭🇳', url: 'https://iptv-org.github.io/iptv/countries/hn.m3u' },
  { id: 'hk', name: 'Hong Kong', icon: '🇭🇰', url: 'https://iptv-org.github.io/iptv/countries/hk.m3u' },
  { id: 'hu', name: 'Hongrie', icon: '🇭🇺', url: 'https://iptv-org.github.io/iptv/countries/hu.m3u' },
  { id: 'in', name: 'Inde', icon: '🇮🇳', url: 'https://iptv-org.github.io/iptv/countries/in.m3u' },
  { id: 'id', name: 'Indonésie', icon: '🇮🇩', url: 'https://iptv-org.github.io/iptv/countries/id.m3u' },
  { id: 'iq', name: 'Irak', icon: '🇮🇶', url: 'https://iptv-org.github.io/iptv/countries/iq.m3u' },
  { id: 'ir', name: 'Iran', icon: '🇮🇷', url: 'https://iptv-org.github.io/iptv/countries/ir.m3u' },
  { id: 'ie', name: 'Irlande', icon: '🇮🇪', url: 'https://iptv-org.github.io/iptv/countries/ie.m3u' },
  { id: 'is', name: 'Islande', icon: '🇮🇸', url: 'https://iptv-org.github.io/iptv/countries/is.m3u' },
  { id: 'il', name: 'Israël', icon: '🇮🇱', url: 'https://iptv-org.github.io/iptv/countries/il.m3u' },
  { id: 'it', name: 'Italie', icon: '🇮🇹', url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
  { id: 'jm', name: 'Jamaïque', icon: '🇯🇲', url: 'https://iptv-org.github.io/iptv/countries/jm.m3u' },
  { id: 'jp', name: 'Japon', icon: '🇯🇵', url: 'https://iptv-org.github.io/iptv/countries/jp.m3u' },
  { id: 'jo', name: 'Jordanie', icon: '🇯🇴', url: 'https://iptv-org.github.io/iptv/countries/jo.m3u' },
  { id: 'kz', name: 'Kazakhstan', icon: '🇰🇿', url: 'https://iptv-org.github.io/iptv/countries/kz.m3u' },
  { id: 'ke', name: 'Kenya', icon: '🇰🇪', url: 'https://iptv-org.github.io/iptv/countries/ke.m3u' },
  { id: 'kg', name: 'Kirghizistan', icon: '🇰🇬', url: 'https://iptv-org.github.io/iptv/countries/kg.m3u' },
  { id: 'xk', name: 'Kosovo', icon: '🇽🇰', url: 'https://iptv-org.github.io/iptv/countries/xk.m3u' },
  { id: 'kw', name: 'Koweït', icon: '🇰🇼', url: 'https://iptv-org.github.io/iptv/countries/kw.m3u' },
  { id: 'la', name: 'Laos', icon: '🇱🇦', url: 'https://iptv-org.github.io/iptv/countries/la.m3u' },
  { id: 're', name: 'La Réunion', icon: '🇷🇪', url: 'https://iptv-org.github.io/iptv/countries/re.m3u' },
  { id: 'lb', name: 'Liban', icon: '🇱🇧', url: 'https://iptv-org.github.io/iptv/countries/lb.m3u' },
  { id: 'lr', name: 'Libéria', icon: '🇱🇷', url: 'https://iptv-org.github.io/iptv/countries/lr.m3u' },
  { id: 'ly', name: 'Libye', icon: '🇱🇾', url: 'https://iptv-org.github.io/iptv/countries/ly.m3u' },
  { id: 'li', name: 'Liechtenstein', icon: '🇱🇮', url: 'https://iptv-org.github.io/iptv/countries/li.m3u' },
  { id: 'lt', name: 'Lituanie', icon: '🇱🇹', url: 'https://iptv-org.github.io/iptv/countries/lt.m3u' },
  { id: 'lu', name: 'Luxembourg', icon: '🇱🇺', url: 'https://iptv-org.github.io/iptv/countries/lu.m3u' },
  { id: 'lv', name: 'Lettonie', icon: '🇱🇻', url: 'https://iptv-org.github.io/iptv/countries/lv.m3u' },
  { id: 'mo', name: 'Macao', icon: '🇲🇴', url: 'https://iptv-org.github.io/iptv/countries/mo.m3u' },
  { id: 'mk', name: 'Macédoine du Nord', icon: '🇲🇰', url: 'https://iptv-org.github.io/iptv/countries/mk.m3u' },
  { id: 'mg', name: 'Madagascar', icon: '🇲🇬', url: 'https://iptv-org.github.io/iptv/countries/mg.m3u' },
  { id: 'my', name: 'Malaisie', icon: '🇲🇾', url: 'https://iptv-org.github.io/iptv/countries/my.m3u' },
  { id: 'mw', name: 'Malawi', icon: '🇲🇼', url: 'https://iptv-org.github.io/iptv/countries/mw.m3u' },
  { id: 'mv', name: 'Maldives', icon: '🇲🇻', url: 'https://iptv-org.github.io/iptv/countries/mv.m3u' },
  { id: 'ml', name: 'Mali', icon: '🇲🇱', url: 'https://iptv-org.github.io/iptv/countries/ml.m3u' },
  { id: 'mt', name: 'Malte', icon: '🇲🇹', url: 'https://iptv-org.github.io/iptv/countries/mt.m3u' },
  { id: 'ma', name: 'Maroc', icon: '🇲🇦', url: 'https://iptv-org.github.io/iptv/countries/ma.m3u' },
  { id: 'mq', name: 'Martinique', icon: '🇲🇶', url: 'https://iptv-org.github.io/iptv/countries/mq.m3u' },
  { id: 'mr', name: 'Mauritanie', icon: '🇲🇷', url: 'https://iptv-org.github.io/iptv/countries/mr.m3u' },
  { id: 'md', name: 'Moldavie', icon: '🇲🇩', url: 'https://iptv-org.github.io/iptv/countries/md.m3u' },
  { id: 'mc', name: 'Monaco', icon: '🇲🇨', url: 'https://iptv-org.github.io/iptv/countries/mc.m3u' },
  { id: 'mn', name: 'Mongolie', icon: '🇲🇳', url: 'https://iptv-org.github.io/iptv/countries/mn.m3u' },
  { id: 'me', name: 'Monténégro', icon: '🇲🇪', url: 'https://iptv-org.github.io/iptv/countries/me.m3u' },
  { id: 'mz', name: 'Mozambique', icon: '🇲🇿', url: 'https://iptv-org.github.io/iptv/countries/mz.m3u' },
  { id: 'mu', name: 'Île Maurice', icon: '🇲🇺', url: 'https://iptv-org.github.io/iptv/countries/mu.m3u' },
  { id: 'mm', name: 'Myanmar (Birmanie)', icon: '🇲🇲', url: 'https://iptv-org.github.io/iptv/countries/mm.m3u' },
  { id: 'na', name: 'Namibie', icon: '🇳🇦', url: 'https://iptv-org.github.io/iptv/countries/na.m3u' },
  { id: 'np', name: 'Népal', icon: '🇳🇵', url: 'https://iptv-org.github.io/iptv/countries/np.m3u' },
  { id: 'ni', name: 'Nicaragua', icon: '🇳🇮', url: 'https://iptv-org.github.io/iptv/countries/ni.m3u' },
  { id: 'ne', name: 'Niger', icon: '🇳🇪', url: 'https://iptv-org.github.io/iptv/countries/ne.m3u' },
  { id: 'ng', name: 'Nigeria', icon: '🇳🇬', url: 'https://iptv-org.github.io/iptv/countries/ng.m3u' },
  { id: 'no', name: 'Norvège', icon: '🇳🇴', url: 'https://iptv-org.github.io/iptv/countries/no.m3u' },
  { id: 'nz', name: 'Nouvelle-Zélande', icon: '🇳🇿', url: 'https://iptv-org.github.io/iptv/countries/nz.m3u' },
  { id: 'nl', name: 'Pays-Bas', icon: '🇳🇱', url: 'https://iptv-org.github.io/iptv/countries/nl.m3u' },
  { id: 'om', name: 'Oman', icon: '🇴🇲', url: 'https://iptv-org.github.io/iptv/countries/om.m3u' },
  { id: 'ug', name: 'Ouganda', icon: '🇺🇬', url: 'https://iptv-org.github.io/iptv/countries/ug.m3u' },
  { id: 'uz', name: 'Ouzbékistan', icon: '🇺🇿', url: 'https://iptv-org.github.io/iptv/countries/uz.m3u' },
  { id: 'pk', name: 'Pakistan', icon: '🇵🇰', url: 'https://iptv-org.github.io/iptv/countries/pk.m3u' },
  { id: 'ps', name: 'Palestine', icon: '🇵🇸', url: 'https://iptv-org.github.io/iptv/countries/ps.m3u' },
  { id: 'pa', name: 'Panama', icon: '🇵🇦', url: 'https://iptv-org.github.io/iptv/countries/pa.m3u' },
  { id: 'pg', name: 'Papouasie-Nouvelle-Guinée', icon: '🇵🇬', url: 'https://iptv-org.github.io/iptv/countries/pg.m3u' },
  { id: 'py', name: 'Paraguay', icon: '🇵🇾', url: 'https://iptv-org.github.io/iptv/countries/py.m3u' },
  { id: 'nl', name: 'Pays-Bas', icon: '🇳🇱', url: 'https://iptv-org.github.io/iptv/countries/nl.m3u' },
  { id: 'pe', name: 'Pérou', icon: '🇵🇪', url: 'https://iptv-org.github.io/iptv/countries/pe.m3u' },
  { id: 'ph', name: 'Philippines', icon: '🇵🇭', url: 'https://iptv-org.github.io/iptv/countries/ph.m3u' },
  { id: 'pl', name: 'Pologne', icon: '🇵🇱', url: 'https://iptv-org.github.io/iptv/countries/pl.m3u' },
  { id: 'pf', name: 'Polynésie française', icon: '🇵🇫', url: 'https://iptv-org.github.io/iptv/countries/pf.m3u' },
  { id: 'pt', name: 'Portugal', icon: '🇵🇹', url: 'https://iptv-org.github.io/iptv/countries/pt.m3u' },
  { id: 'pr', name: 'Porto Rico', icon: '🇵🇷', url: 'https://iptv-org.github.io/iptv/countries/pr.m3u' },
  { id: 'qa', name: 'Qatar', icon: '🇶🇦', url: 'https://iptv-org.github.io/iptv/countries/qa.m3u' },
  { id: 'ro', name: 'Roumanie', icon: '🇷🇴', url: 'https://iptv-org.github.io/iptv/countries/ro.m3u' },
  { id: 'gb', name: 'Royaume-Uni', icon: '🇬🇧', url: 'https://iptv-org.github.io/iptv/countries/gb.m3u' },
  { id: 'rw', name: 'Rwanda', icon: '🇷🇼', url: 'https://iptv-org.github.io/iptv/countries/rw.m3u' },
  { id: 'ru', name: 'Russie', icon: '🇷🇺', url: 'https://iptv-org.github.io/iptv/countries/ru.m3u' },
  { id: 'kn', name: 'Saint-Christophe-et-Niévès', icon: '🇰🇳', url: 'https://iptv-org.github.io/iptv/countries/kn.m3u' },
  { id: 'sm', name: 'Saint Marin', icon: '🇸🇲', url: 'https://iptv-org.github.io/iptv/countries/sm.m3u' },
  { id: 'sx', name: 'Saint-Martin', icon: '🇸🇽', url: 'https://iptv-org.github.io/iptv/countries/sx.m3u' },
  { id: 'lc', name: 'Sainte-Lucie', icon: '🇱🇨', url: 'https://iptv-org.github.io/iptv/countries/lc.m3u' },
  { id: 'as', name: 'Samoa Américaines', icon: '🇦🇸', url: 'https://iptv-org.github.io/iptv/countries/as.m3u' },
  { id: 'ws', name: 'Samoa', icon: '🇼🇸', url: 'https://iptv-org.github.io/iptv/countries/ws.m3u' },
  { id: 'sn', name: 'Sénégal', icon: '🇸🇳', url: 'https://iptv-org.github.io/iptv/countries/sn.m3u' },
  { id: 'rs', name: 'Serbie', icon: '🇷🇸', url: 'https://iptv-org.github.io/iptv/countries/rs.m3u' },
  { id: 'sl', name: 'Sierra Leone', icon: '🇸🇱', url: 'https://iptv-org.github.io/iptv/countries/sl.m3u' },
  { id: 'sg', name: 'Singapour', icon: '🇸🇬', url: 'https://iptv-org.github.io/iptv/countries/sg.m3u' },
  { id: 'sk', name: 'Slovaquie', icon: '🇸🇰', url: 'https://iptv-org.github.io/iptv/countries/sk.m3u' },
  { id: 'si', name: 'Slovénie', icon: '🇸🇮', url: 'https://iptv-org.github.io/iptv/countries/si.m3u' },
  { id: 'so', name: 'Somalie', icon: '🇸🇴', url: 'https://iptv-org.github.io/iptv/countries/so.m3u' },
  { id: 'sd', name: 'Soudan', icon: '🇸🇩', url: 'https://iptv-org.github.io/iptv/countries/sd.m3u' },
  { id: 'lk', name: 'Sri Lanka', icon: '🇱🇰', url: 'https://iptv-org.github.io/iptv/countries/lk.m3u' },
  { id: 'sr', name: 'Suriname', icon: '🇸🇷', url: 'https://iptv-org.github.io/iptv/countries/sr.m3u' },
  { id: 'se', name: 'Suède', icon: '🇸🇪', url: 'https://iptv-org.github.io/iptv/countries/se.m3u' },
  { id: 'ch', name: 'Suisse', icon: '🇨🇭', url: 'https://iptv-org.github.io/iptv/countries/ch.m3u' },
  { id: 'sy', name: 'Syrie', icon: '🇸🇾', url: 'https://iptv-org.github.io/iptv/countries/sy.m3u' },
  { id: 'tj', name: 'Tadjikistan', icon: '🇹🇯', url: 'https://iptv-org.github.io/iptv/countries/tj.m3u' },
  { id: 'tw', name: 'Taïwan', icon: '🇹🇼', url: 'https://iptv-org.github.io/iptv/countries/tw.m3u' },
  { id: 'tz', name: 'Tanzanie', icon: '🇹🇿', url: 'https://iptv-org.github.io/iptv/countries/tz.m3u' },
  { id: 'td', name: 'Tchad', icon: '🇹🇩', url: 'https://iptv-org.github.io/iptv/countries/td.m3u' },
  { id: 'cz', name: 'République tchèque', icon: '🇨🇿', url: 'https://iptv-org.github.io/iptv/countries/cz.m3u' },
  { id: 'th', name: 'Thaïlande', icon: '🇹🇭', url: 'https://iptv-org.github.io/iptv/countries/th.m3u' },
  { id: 'tg', name: 'Togo', icon: '🇹🇬', url: 'https://iptv-org.github.io/iptv/countries/tg.m3u' },
  { id: 'tt', name: 'Trinité-et-Tobago', icon: '🇹🇹', url: 'https://iptv-org.github.io/iptv/countries/tt.m3u' },
  { id: 'tn', name: 'Tunisie', icon: '🇹🇳', url: 'https://iptv-org.github.io/iptv/countries/tn.m3u' },
  { id: 'tm', name: 'Turkménistan', icon: '🇹🇲', url: 'https://iptv-org.github.io/iptv/countries/tm.m3u' },
  { id: 'tr', name: 'Turquie', icon: '🇹🇷', url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
  { id: 'ua', name: 'Ukraine', icon: '🇺🇦', url: 'https://iptv-org.github.io/iptv/countries/ua.m3u' },
  { id: 'uy', name: 'Uruguay', icon: '🇺🇾', url: 'https://iptv-org.github.io/iptv/countries/uy.m3u' },
  { id: 'va', name: 'Cité du Vatican', icon: '🇻🇦', url: 'https://iptv-org.github.io/iptv/countries/va.m3u' },
  { id: 've', name: 'Venezuela', icon: '🇻🇪', url: 'https://iptv-org.github.io/iptv/countries/ve.m3u' },
  { id: 'vn', name: 'Vietnam', icon: '🇻🇳', url: 'https://iptv-org.github.io/iptv/countries/vn.m3u' },
  { id: 'vg', name: 'Îles Vierges britanniques', icon: '🇻🇬', url: 'https://iptv-org.github.io/iptv/countries/vg.m3u' },
  { id: 'vi', name: 'Îles Vierges américaines', icon: '🇻🇮', url: 'https://iptv-org.github.io/iptv/countries/vi.m3u' },
  { id: 'sv', name: 'Le Salvador', icon: '🇸🇻', url: 'https://iptv-org.github.io/iptv/countries/sv.m3u' },
  { id: 'eh', name: 'Sahara occidental', icon: '🇪🇭', url: 'https://iptv-org.github.io/iptv/countries/eh.m3u' },
  { id: 'ye', name: 'Yémen', icon: '🇾🇪', url: 'https://iptv-org.github.io/iptv/countries/ye.m3u' },
  { id: 'zm', name: 'Zambie', icon: '🇿🇲', url: 'https://iptv-org.github.io/iptv/countries/zm.m3u' },
  { id: 'zw', name: 'Zimbabwe', icon: '🇿🇼', url: 'https://iptv-org.github.io/iptv/countries/zw.m3u' },
  { id: 'int', name: 'Autres pays', icon: '🌍', url: 'https://iptv-org.github.io/iptv/countries/int.m3u' },
];

const VALID_ID = /^[a-z]{2,5}$/;

function fetchText(url, timeoutMs, redirectCount) {
  if ((redirectCount || 0) > 5) return Promise.reject(new Error('Trop de redirections'));
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http;
    var timer  = setTimeout(function() { reject(new Error('TIMEOUT')); }, timeoutMs);
    var req = client.get(url, { headers: { 'User-Agent': 'IPTV-Player/1.0', 'Accept': '*/*' } }, function(res) {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timer);
        fetchText(res.headers.location, timeoutMs, (redirectCount || 0) + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { clearTimeout(timer); reject(new Error('HTTP ' + res.statusCode)); return; }
      res.setEncoding('utf8');
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end',  function() { clearTimeout(timer); resolve(data); });
      res.on('error', function(e) { clearTimeout(timer); reject(e); });
    });
    req.on('error', function(e) { clearTimeout(timer); reject(e); });
  });
}

function parseM3U(text) {
  var lines = text.split('\n');
  var channels = [];
  var current = null;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      current = parseExtinf(line);
    } else if (line.startsWith('#')) {
      continue;
    } else if (/^https?:\/\//i.test(line)) {
      if (current) { current.url = line; channels.push(current); current = null; }
    }
  }
  return channels;
}

function parseExtinf(line) {
  var ch = { name: '', group: '', logo: '', url: '' };
  var ci = line.lastIndexOf(',');
  if (ci !== -1) ch.name = line.slice(ci + 1).trim();
  ch.logo  = extractAttr(line, 'tvg-logo');
  ch.group = extractAttr(line, 'group-title');
  if (!ch.name) ch.name = extractAttr(line, 'tvg-name') || 'Chaîne inconnue';
  return ch;
}

function extractAttr(line, attr) {
  var re = new RegExp(attr + '=["\']([^"\']*)["\']', 'i');
  var m  = line.match(re);
  return m ? m[1].trim() : '';
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET')     { res.status(405).json({ error: 'Méthode non autorisée.' }); return; }

  var id = req.query ? req.query.id : undefined;

  if (!id) {
    res.status(200).json({
      regions: REGIONS.map(function(r) { return { id: r.id, name: r.name, icon: r.icon }; })
    });
    return;
  }

  if (!VALID_ID.test(id)) { res.status(400).json({ error: 'ID région invalide.' }); return; }

  var region = null;
  for (var i = 0; i < REGIONS.length; i++) { if (REGIONS[i].id === id) { region = REGIONS[i]; break; } }
  if (!region) { res.status(404).json({ error: 'Région introuvable : ' + id }); return; }

  fetchText(region.url, 20000)
    .then(function(text) {
      if (!text.trim().startsWith('#EXTM3U')) {
        res.status(422).json({ error: "Fichier M3U invalide." });
        return;
      }
      var channels = parseM3U(text);
      res.status(200).json({ region: { id: region.id, name: region.name, icon: region.icon }, total: channels.length, channels: channels });
    })
    .catch(function(err) {
      if (err.message === 'TIMEOUT') { res.status(504).json({ error: 'Délai dépassé (20s).' }); return; }
      res.status(500).json({ error: 'Erreur : ' + (err.message || 'inconnue') });
    });
};
