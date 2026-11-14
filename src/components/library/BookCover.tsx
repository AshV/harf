import React from 'react';

interface BookCoverProps {
  id: string;
  title: string;
  author: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

interface Palette {
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  authorColor: string;
  accentColor: string;
  badgeBg: string;
  motif: string;
}

const PALETTES: Record<string, Palette> = {
  kaffan: {
    bgGradient: 'from-[#1A1817] via-[#2D2421] to-[#171413]',
    borderColor: 'border-[#D4AF37]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#D4AF37]',
    accentColor: '#D4AF37',
    badgeBg: 'bg-[#D4AF37]/15 text-[#F3E5AB]',
    motif: '✦ ❖ ✦'
  },
  'panch-parameshwar': {
    bgGradient: 'from-[#0F1D33] via-[#1A2C4B] to-[#0A1322]',
    borderColor: 'border-[#E0A948]/40',
    titleColor: 'text-[#FAF8F5]',
    authorColor: 'text-[#E0A948]',
    accentColor: '#E0A948',
    badgeBg: 'bg-[#E0A948]/15 text-[#FBE3B5]',
    motif: '❖ ⚖️ ❖'
  },
  idgah: {
    bgGradient: 'from-[#0D281E] via-[#163D2E] to-[#081B14]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '✦ 🌙 ✦'
  },
  'bade-bhai-sahab': {
    bgGradient: 'from-[#5C1D16] via-[#7A281E] to-[#45120D]',
    borderColor: 'border-[#EBB059]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#EBB059]',
    accentColor: '#EBB059',
    badgeBg: 'bg-[#EBB059]/15 text-[#FDE5BD]',
    motif: '❖ 📜 ❖'
  },
  godaan: {
    bgGradient: 'from-[#4A2013] via-[#632C1A] to-[#36160B]',
    borderColor: 'border-[#E2A745]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E2A745]',
    accentColor: '#E2A745',
    badgeBg: 'bg-[#E2A745]/15 text-[#FDE7BE]',
    motif: '✦ 🌾 ✦'
  },
  mamta: {
    bgGradient: 'from-[#3B1E48] via-[#4D285E] to-[#2B1435]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FAF5FD]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '❖ 🏰 ❖'
  },
  'andher-nagari': {
    bgGradient: 'from-[#4D1515] via-[#661D1D] to-[#360D0D]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '❖ 👑 ❖'
  },
  'rani-ketki-ki-kahani': {
    bgGradient: 'from-[#421A2C] via-[#5C243D] to-[#2E111E]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#FFF5F8]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 🌺 ✦'
  },
  kamayani: {
    bgGradient: 'from-[#0D1D2D] via-[#162D44] to-[#08121C]',
    borderColor: 'border-[#93B5C6]/40',
    titleColor: 'text-[#EBF3F8]',
    authorColor: 'text-[#93B5C6]',
    accentColor: '#93B5C6',
    badgeBg: 'bg-[#93B5C6]/15 text-[#D4E4ED]',
    motif: '✦ 🏔️ ✦'
  },
  nirmala: {
    bgGradient: 'from-[#54201A] via-[#702B23] to-[#3D1511]',
    borderColor: 'border-[#E8AA58]/40',
    titleColor: 'text-[#FFF9F2]',
    authorColor: 'text-[#E8AA58]',
    accentColor: '#E8AA58',
    badgeBg: 'bg-[#E8AA58]/15 text-[#FDE6BD]',
    motif: '❖ 🕊️ ❖'
  },
  'chandrakanta-santati-1': {
    bgGradient: 'from-[#0C1A2B] via-[#152B46] to-[#07111D]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '❖ 🗝️ ❖'
  },
  'chandrakanta-santati-2': {
    bgGradient: 'from-[#0C241D] via-[#143B2F] to-[#071813]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 🗡️ ✦'
  },
  'bharat-durdasha': {
    bgGradient: 'from-[#4A1212] via-[#661A1A] to-[#330A0A]',
    borderColor: 'border-[#E0A948]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#E0A948]',
    accentColor: '#E0A948',
    badgeBg: 'bg-[#E0A948]/15 text-[#FDE3B5]',
    motif: '✦ 🎭 ✦'
  },
  'satya-harishchandra': {
    bgGradient: 'from-[#4D280B] via-[#6B370E] to-[#361B07]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF9F0]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '❖ ☀️ ❖'
  },
  'bikhare-moti': {
    bgGradient: 'from-[#3B142B] via-[#521C3C] to-[#2B0E20]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#FFF5FB]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 🦪 ✦'
  },
  'billesur-bakriha': {
    bgGradient: 'from-[#2E1E14] via-[#422B1D] to-[#1F140D]',
    borderColor: 'border-[#9BBF85]/40',
    titleColor: 'text-[#F5F8F2]',
    authorColor: 'text-[#9BBF85]',
    accentColor: '#9BBF85',
    badgeBg: 'bg-[#9BBF85]/15 text-[#E4F0DE]',
    motif: '❖ 🌾 ❖'
  },
  'shivshambhu-ke-chitthe': {
    bgGradient: 'from-[#3A1412] via-[#521C1A] to-[#260B0A]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '❖ ⚖️ ❖'
  },
  dhruvaswamini: {
    bgGradient: 'from-[#141B34] via-[#1E284D] to-[#0D1224]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#F5F7FD]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 👑 ✦'
  },
  neeldevi: {
    bgGradient: 'from-[#0C243B] via-[#123657] to-[#081829]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#F0F7FD]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '❖ ⚔️ ❖'
  },
  'kabir-granthavali': {
    bgGradient: 'from-[#4D240E] via-[#6B3213] to-[#361708]',
    borderColor: 'border-[#F5C563]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#F5C563]',
    accentColor: '#F5C563',
    badgeBg: 'bg-[#F5C563]/15 text-[#FDF0CD]',
    motif: '✦ 🪔 ✦'
  },
  aakashdeep: {
    bgGradient: 'from-[#09222E] via-[#0E3547] to-[#051720]',
    borderColor: 'border-[#68C5DB]/40',
    titleColor: 'text-[#F0FAFD]',
    authorColor: 'text-[#68C5DB]',
    accentColor: '#68C5DB',
    badgeBg: 'bg-[#68C5DB]/15 text-[#D1F0F7]',
    motif: '✦ 🌟 ✦'
  },
  priyapravas: {
    bgGradient: 'from-[#541D12] via-[#752617] to-[#3D120B]',
    borderColor: 'border-[#F5A623]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F5A623]',
    accentColor: '#F5A623',
    badgeBg: 'bg-[#F5A623]/15 text-[#FDEACC]',
    motif: '✦ 🌅 ✦'
  },
  chintamani: {
    bgGradient: 'from-[#172619] via-[#223826] to-[#101C12]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#F5F8F4]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FBEFCF]',
    motif: '❖ 🖋️ ❖'
  },
  'pariksha-guru': {
    bgGradient: 'from-[#382315] via-[#4F321E] to-[#26170D]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FAF6F0]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 🏛️ ✦'
  },
  'bihari-satsai': {
    bgGradient: 'from-[#4D290A] via-[#6E3B0F] to-[#361B06]',
    borderColor: 'border-[#F5C563]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#F5C563]',
    accentColor: '#F5C563',
    badgeBg: 'bg-[#F5C563]/15 text-[#FDF0CD]',
    motif: '❖ 🏹 ❖'
  },
  skandagupta: {
    bgGradient: 'from-[#1B1938] via-[#282654] to-[#121026]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#F5F4FE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FDEECC]',
    motif: '✦ 🛡️ ✦'
  },
  'rahim-dohavali': {
    bgGradient: 'from-[#0E291E] via-[#173D2D] to-[#0A1C14]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#F2FAF6]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FDE7C5]',
    motif: '❖ 💎 ❖'
  },
  kavitavali: {
    bgGradient: 'from-[#4D1C0F] via-[#6B2815] to-[#361309]',
    borderColor: 'border-[#F5C563]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F5C563]',
    accentColor: '#F5C563',
    badgeBg: 'bg-[#F5C563]/15 text-[#FDF0CD]',
    motif: '✦ 🏹 ✦'
  },
  sevasadan: {
    bgGradient: 'from-[#421722] via-[#5C202F] to-[#2B0E16]',
    borderColor: 'border-[#E2A745]/40',
    titleColor: 'text-[#FFF6F8]',
    authorColor: 'text-[#E2A745]',
    accentColor: '#E2A745',
    badgeBg: 'bg-[#E2A745]/15 text-[#FDE3B5]',
    motif: '❖ 🏠 ❖'
  },
  'chaturi-chamar': {
    bgGradient: 'from-[#3A2218] via-[#543122] to-[#26160F]',
    borderColor: 'border-[#D98A5B]/40',
    titleColor: 'text-[#FAF6F2]',
    authorColor: 'text-[#D98A5B]',
    accentColor: '#D98A5B',
    badgeBg: 'bg-[#D98A5B]/15 text-[#FDE6D8]',
    motif: '❖ ✊ ❖'
  },
  titli: {
    bgGradient: 'from-[#3D2C11] via-[#573F18] to-[#291D0B]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '✦ 🦋 ✦'
  },
  rangbhoomi: {
    bgGradient: 'from-[#1A2634] via-[#26374A] to-[#121B24]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#F2F7FA]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '❖ 🪔 ❖'
  },
  karmabhoomi: {
    bgGradient: 'from-[#421A12] via-[#5E2419] to-[#2B100B]',
    borderColor: 'border-[#F5A623]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F5A623]',
    accentColor: '#F5A623',
    badgeBg: 'bg-[#F5A623]/15 text-[#FDEACC]',
    motif: '❖ 🌾 ❖'
  },
  'rasagya-ranjan': {
    bgGradient: 'from-[#0E2033] via-[#142F4A] to-[#0A1725]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#F2F6FA]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 🪶 ✦'
  },
  padmavat: {
    bgGradient: 'from-[#451224] via-[#611A33] to-[#2E0B18]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FFF5F8]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '❖ 🦜 ❖'
  },
  gaban: {
    bgGradient: 'from-[#4D1C13] via-[#66261A] to-[#36110B]',
    borderColor: 'border-[#E2A745]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E2A745]',
    accentColor: '#E2A745',
    badgeBg: 'bg-[#E2A745]/15 text-[#FDE7BE]',
    motif: '✦ 💍 ✦'
  },
  chandragupta: {
    bgGradient: 'from-[#141528] via-[#222442] to-[#0D0E1A]',
    borderColor: 'border-[#E8BA60]/40',
    titleColor: 'text-[#F3F4FB]',
    authorColor: 'text-[#E8BA60]',
    accentColor: '#E8BA60',
    badgeBg: 'bg-[#E8BA60]/15 text-[#FCEAC4]',
    motif: '❖ ⚔️ ❖'
  },
  'bhramargeet-saar': {
    bgGradient: 'from-[#081F36] via-[#103357] to-[#051424]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#F2F8FC]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 🦚 ✦'
  },
  'sahitya-ka-uddeshya': {
    bgGradient: 'from-[#142A1D] via-[#1F3D2B] to-[#0D1C13]',
    borderColor: 'border-[#E0BA62]/40',
    titleColor: 'text-[#F3FAF5]',
    authorColor: 'text-[#E0BA62]',
    accentColor: '#E0BA62',
    badgeBg: 'bg-[#E0BA62]/15 text-[#FCEAC5]',
    motif: '❖ 🖋️ ❖'
  },
  'shri-chandravali': {
    bgGradient: 'from-[#421429] via-[#5C1D3A] to-[#2B0C1A]',
    borderColor: 'border-[#F3C86A]/40',
    titleColor: 'text-[#FFF5F8]',
    authorColor: 'text-[#F3C86A]',
    accentColor: '#F3C86A',
    badgeBg: 'bg-[#F3C86A]/15 text-[#FDF0CE]',
    motif: '✦ 🌸 ✦'
  },
  'vaidehi-vanvas': {
    bgGradient: 'from-[#451D0B] via-[#612A11] to-[#2E1205]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 🌿 ✦'
  },
  kayakalph: {
    bgGradient: 'from-[#161726] via-[#24263D] to-[#0E0F1A]',
    borderColor: 'border-[#D4AF37]/40',
    titleColor: 'text-[#F4F4FA]',
    authorColor: 'text-[#D4AF37]',
    accentColor: '#D4AF37',
    badgeBg: 'bg-[#D4AF37]/15 text-[#F6EAC4]',
    motif: '❖ 🕉️ ❖'
  },
  'akhrawat-aakhiri-kalam': {
    bgGradient: 'from-[#0A261D] via-[#143B2E] to-[#061913]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#F2FBF6]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 📜 ✦'
  },
  'bacon-vichar-ratnavali': {
    bgGradient: 'from-[#38141F] via-[#521E2E] to-[#240C14]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FFF5F7]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '❖ ⚖️ ❖'
  },
  mudrarakshasa: {
    bgGradient: 'from-[#361313] via-[#4F1A1A] to-[#240A0A]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '✦ 💍 ✦'
  },
  'prem-dwadashi': {
    bgGradient: 'from-[#23122D] via-[#381B47] to-[#160B1C]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FAF5FC]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '❖ ♟️ ❖'
  },
  'sapta-saroj': {
    bgGradient: 'from-[#38121D] via-[#521A2A] to-[#240A12]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#FFF5F8]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 🪷 ✦'
  },
  premjogini: {
    bgGradient: 'from-[#421A12] via-[#5C2519] to-[#2B100B]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '❖ 🪔 ❖'
  },
  'sati-pratap': {
    bgGradient: 'from-[#0F2618] via-[#163B25] to-[#0A1A10]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#F2FAF5]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 👑 ✦'
  },
  'adbhut-aalap': {
    bgGradient: 'from-[#091426] via-[#102342] to-[#050C17]',
    borderColor: 'border-[#8EC5FC]/40',
    titleColor: 'text-[#F0F6FD]',
    authorColor: 'text-[#8EC5FC]',
    accentColor: '#8EC5FC',
    badgeBg: 'bg-[#8EC5FC]/15 text-[#DDF0FE]',
    motif: '❖ 🔭 ❖'
  },
  'venice-ka-banka': {
    bgGradient: 'from-[#0A2A33] via-[#14424F] to-[#061A20]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#F2FBFB]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ ⚖️ ✦'
  },
  'sahitya-seekar': {
    bgGradient: 'from-[#1B2612] via-[#2A3B1C] to-[#121A0C]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#F5F8F2]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FDF0CD]',
    motif: '❖ 📜 ❖'
  },
  'puratattva-prasang': {
    bgGradient: 'from-[#361B10] via-[#4D2717] to-[#24110A]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '✦ 🏛️ ✦'
  },
  'prem-panchami': {
    bgGradient: 'from-[#3D1219] via-[#571923] to-[#260A10]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FFF5F7]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '❖ 🌸 ❖'
  },
  'dhananjay-vijay': {
    bgGradient: 'from-[#33200B] via-[#4A2F10] to-[#211406]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 🏹 ✦'
  },
  'ek-ghoont': {
    bgGradient: 'from-[#241C0A] via-[#382C10] to-[#171206]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#FAF6EE]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FDF0CD]',
    motif: '❖ 🍵 ❖'
  },
  'kavya-aur-kala': {
    bgGradient: 'from-[#0C1626] via-[#14243D] to-[#080E1A]',
    borderColor: 'border-[#94B8DB]/40',
    titleColor: 'text-[#F0F5FA]',
    authorColor: 'text-[#94B8DB]',
    accentColor: '#94B8DB',
    badgeBg: 'bg-[#94B8DB]/15 text-[#DDE9F5]',
    motif: '✦ 🎭 ✦'
  },
  'meri-aatmakahani': {
    bgGradient: 'from-[#38160E] via-[#522015] to-[#240E09]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '❖ 🖋️ ❖'
  },
  'paanch-phool': {
    bgGradient: 'from-[#36121D] via-[#4F1A2A] to-[#210A12]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FFF5F7]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '✦ 💐 ✦'
  },
  'revatat-prithviraj-raso': {
    bgGradient: 'from-[#421A07] via-[#5E250A] to-[#2B1004]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '❖ ⚔️ ❖'
  },
  'kahani-khatm-ho-gayi': {
    bgGradient: 'from-[#3B151E] via-[#541E2B] to-[#260C13]',
    borderColor: 'border-[#EBB059]/40',
    titleColor: 'text-[#FFF5F6]',
    authorColor: 'text-[#EBB059]',
    accentColor: '#EBB059',
    badgeBg: 'bg-[#EBB059]/15 text-[#FDE5BD]',
    motif: '❖ 🗡️ ❖'
  },
  aandhi: {
    bgGradient: 'from-[#17202A] via-[#243342] to-[#0E151C]',
    borderColor: 'border-[#76D7C4]/40',
    titleColor: 'text-[#F0FDF4]',
    authorColor: 'text-[#76D7C4]',
    accentColor: '#76D7C4',
    badgeBg: 'bg-[#76D7C4]/15 text-[#C8F7DC]',
    motif: '✦ 🌪️ ✦'
  },
  karbala: {
    bgGradient: 'from-[#2A0D10] via-[#421419] to-[#1A0709]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF5F5]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '✦ 🕊️ ✦'
  },
  sangram: {
    bgGradient: 'from-[#261608] via-[#3D230C] to-[#170D05]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '❖ 🌾 ❖'
  },
  'chokhe-chaupade': {
    bgGradient: 'from-[#11241A] via-[#1B3829] to-[#0A1710]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#F4FCF7]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '✦ 💎 ✦'
  },
  'sapre-kahaniyan': {
    bgGradient: 'from-[#211510] via-[#332018] to-[#140C09]',
    borderColor: 'border-[#E2A745]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E2A745]',
    accentColor: '#E2A745',
    badgeBg: 'bg-[#E2A745]/15 text-[#FDE7BE]',
    motif: '❖ 🧺 ❖'
  },
  dewangana: {
    bgGradient: 'from-[#2A122E] via-[#3E1A45] to-[#1C0A1F]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FDF5FE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 🛕 ✦'
  },
  'kuch-vichar': {
    bgGradient: 'from-[#13232E] via-[#1E3545] to-[#0B151C]',
    borderColor: 'border-[#76D7C4]/40',
    titleColor: 'text-[#F0FDFB]',
    authorColor: 'text-[#76D7C4]',
    accentColor: '#76D7C4',
    badgeBg: 'bg-[#76D7C4]/15 text-[#C8F7DC]',
    motif: '❖ 💡 ❖'
  },
  'bharatendu-jivan-charitra': {
    bgGradient: 'from-[#3B1E08] via-[#542B0C] to-[#261304]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '✦ 📜 ✦'
  },
  'anand-math': {
    bgGradient: 'from-[#0A261A] via-[#133D2A] to-[#061A11]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#F2FAF6]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '❖ 🚩 ❖'
  },
  'hindi-sahitya-ka-itihas': {
    bgGradient: 'from-[#2A1708] via-[#40230C] to-[#1C0F05]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '❖ 📖 ❖'
  },
  premsagar: {
    bgGradient: 'from-[#0B2538] via-[#143954] to-[#071824]',
    borderColor: 'border-[#8EC5FC]/40',
    titleColor: 'text-[#F0F7FD]',
    authorColor: 'text-[#8EC5FC]',
    accentColor: '#8EC5FC',
    badgeBg: 'bg-[#8EC5FC]/15 text-[#DDF0FE]',
    motif: '✦ 🌊 ✦'
  },
  sahityalaap: {
    bgGradient: 'from-[#1F2410] via-[#303819] to-[#14170A]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#F6F8F0]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FDF0CD]',
    motif: '❖ 🗣️ ❖'
  },
  'dharm-ke-naam-par': {
    bgGradient: 'from-[#2E1210] via-[#451B18] to-[#1F0C0A]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF5F5]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '✦ ⚖️ ✦'
  },
  awaragard: {
    bgGradient: 'from-[#19192B] via-[#262640] to-[#10101C]',
    borderColor: 'border-[#C39BD3]/40',
    titleColor: 'text-[#F8F5FD]',
    authorColor: 'text-[#C39BD3]',
    accentColor: '#C39BD3',
    badgeBg: 'bg-[#C39BD3]/15 text-[#EEDBF5]',
    motif: '❖ 🚶 ❖'
  },
  premashram: {
    bgGradient: 'from-[#291708] via-[#42250E] to-[#1A0E05]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '❖ 🏡 ❖'
  },
  'mansarovar-2': {
    bgGradient: 'from-[#0E2433] via-[#16384F] to-[#091721]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#F2FAF6]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEBC4]',
    motif: '✦ 🦢 ✦'
  },
  'kural-kavya': {
    bgGradient: 'from-[#1C2612] via-[#2D3D1D] to-[#121A0B]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#F6F8F0]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FDF0CD]',
    motif: '❖ 📜 ❖'
  },
  'ayodhya-ka-itihas': {
    bgGradient: 'from-[#381B0E] via-[#522714] to-[#241109]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '✦ 🏛️ ✦'
  },
  'tata-jivan-charitra': {
    bgGradient: 'from-[#161D26] via-[#232E3D] to-[#0E131A]',
    borderColor: 'border-[#8EC5FC]/40',
    titleColor: 'text-[#F0F6FD]',
    authorColor: 'text-[#8EC5FC]',
    accentColor: '#8EC5FC',
    badgeBg: 'bg-[#8EC5FC]/15 text-[#DDF0FE]',
    motif: '❖ ⚙️ ❖'
  }
};

const DEFAULT_PALETTE: Palette = {
  bgGradient: 'from-[#2A1810] via-[#3E2317] to-[#1F120B]',
  borderColor: 'border-[#D8A856]/40',
  titleColor: 'text-[#FAF7F2]',
  authorColor: 'text-[#D8A856]',
  accentColor: '#D8A856',
  badgeBg: 'bg-[#D8A856]/15 text-[#FDE3B5]',
  motif: '✦ ❖ ✦'
};

export const BookCover: React.FC<BookCoverProps> = ({
  id,
  title,
  author,
  category = 'कहानी',
  size = 'md',
  className = ''
}) => {
  const palette = PALETTES[id] || DEFAULT_PALETTE;

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-24 aspect-[2/3]',
    md: 'w-full aspect-[2/3]',
    lg: 'w-48 aspect-[2/3]',
    hero: 'w-44 sm:w-56 aspect-[2/3]'
  }[size];

  return (
    <div
      className={`relative select-none rounded-xl overflow-hidden shadow-xl transition-all duration-300 ${sizeClasses} ${className}`}
      style={{
        boxShadow:
          '0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 6px 14px -4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      }}
    >
      {/* 3D Book Spine Effect (Left Side Depth & Crease) */}
      <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-20 pointer-events-none" />
      <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-black/40 z-20 pointer-events-none" />

      {/* Book Cloth / Paper Texture Background */}
      <div
        className={`w-full h-full bg-gradient-to-b ${palette.bgGradient} p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden`}
      >
        {/* Subtle Ornamental Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, white 1.5px, transparent 1.5px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Outer Filigree Border */}
        <div
          className={`absolute inset-2 border ${palette.borderColor} rounded-lg pointer-events-none flex flex-col justify-between p-1`}
        >
          {/* Inner Inset Border */}
          <div className="w-full h-full border border-dashed border-white/15 rounded-md pointer-events-none" />
        </div>

        {/* Top Header: Category Tag & Series */}
        <div className="relative z-10 text-center pt-1">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${palette.badgeBg}`}
          >
            {category}
          </span>
          <div className="text-[10px] sm:text-[11px] opacity-70 mt-1" style={{ color: palette.accentColor }}>
            {palette.motif}
          </div>
        </div>

        {/* Center: Book Title in Classic Serif Typography */}
        <div className="relative z-10 text-center px-2 my-auto">
          <h3
            className={`font-serif font-black tracking-wide leading-tight ${palette.titleColor} drop-shadow-md line-clamp-2 ${
              size === 'sm'
                ? 'text-xs'
                : size === 'hero'
                ? 'text-2xl sm:text-3xl'
                : 'text-lg sm:text-xl'
            }`}
          >
            {title}
          </h3>

          {/* Delicate Divider Ornament */}
          <div className="flex items-center justify-center gap-1.5 my-2 opacity-50">
            <div className="h-[1px] w-5 bg-current" style={{ color: palette.accentColor }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: palette.accentColor }} />
            <div className="h-[1px] w-5 bg-current" style={{ color: palette.accentColor }} />
          </div>

          <p
            className={`font-hindi-serif font-bold text-center line-clamp-1 ${palette.authorColor} ${
              size === 'sm' ? 'text-[10px]' : 'text-xs sm:text-sm'
            }`}
          >
            {author}
          </p>
        </div>

        {/* Bottom Publisher / Heritage Seal */}
        <div className="relative z-10 text-center pb-0.5">
          <span className="text-[8px] sm:text-[9px] font-semibold tracking-widest uppercase text-white/50 block">
            हर्फ़ साहित्य शृंखला
          </span>
        </div>
      </div>
    </div>
  );
};

