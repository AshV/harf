# हर्फ़ (Harf) — आधुनिक हिन्दी ई-पुस्तकालय

> **हर्फ़**: सार्वजनिक डोमेन हिन्दी साहित्य के लिए आधुनिक, ऑफ़लाइन, मोबाइल-प्रथम डिजिटल पुस्तकालय एवं ई-रीडर।

![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_Vite_6_|_Tailwind_v4_|_PWA-blue)
![Database](https://img.shields.io/badge/Storage-IndexedDB_(Dexie.js)-green)
![Language](https://img.shields.io/badge/Language-Hindi_(हिन्दी)-orange)

---

## 🌟 मुख्य विशेषताएँ (Key Features)

- **पूर्णतः ऑफ़लाइन (100% Offline via PWA & IndexedDB):** एक क्लिक में पूरी किताब डाउनलोड करें और बिना इंटरनेट के कभी भी पढ़ें।
- **देवनागरी विशिष्ट टाइपोग्राफी:**
  - `Noto Serif Devanagari` व `Noto Sans Devanagari` फ़ॉन्ट एकीकरण।
  - अपर/लोअर मात्राओं के लिए अनुकूलित पंक्ति दूरी (`1.85x line-height`)।
  - चार विशिष्ट रीडिंग थीम्स: **कागज़ (Parchment)**, **रात (OLED True Black)**, **दिन (Crisp Day)** और **शांत (Sage)**।
- **ऑडियो रीड-अलॉन्ग (Hindi Text-to-Speech):**
  - ब्राउज़र के मूल `SpeechSynthesis` API (`hi-IN`) का उपयोग।
  - वाचन के समय सक्रिय पैराग्राफ़ को ऑटो-स्क्रॉल व हाइलाइट करता है।
- **द्विभाषी खोज (Hinglish + Devanagari Search):**
  - 'Godan' या 'गोदान', 'Premchand' या 'प्रेमचंद'—अंग्रेजी कीबोर्ड से भी सटीक खोज।
- **कस्टम चंक्ड डेटा प्रारूप (No EPUB/PDF Bloat):**
  - शुद्ध स्ट्रक्चर्ड JSON ब्लॉक्स, जो EPUB से 70% हल्के और तेज़ लोड होते हैं।
- **एसईओ और डिस्कवरेबिलिटी (SEO):**
  - `sitemap.xml`, ओपन-ग्राफ़ (WhatsApp/Twitter) कार्ड्स और `Schema.org/Book` स्ट्रक्चर्ड डेटा।

---

## 🚀 स्थानीय विकास (Local Setup)

```bash
# 1. रिपॉजिटरी क्लोन करें
cd harf

# 2. डिपेंडेंसी इंस्टॉल करें
npm install

# 3. पांडुलिपियों को पार्स करें और डेव सर्वर चलाएँ
npm run dev
```

---

## 📚 नई पुस्तक कैसे जोड़ें (Adding New Books)

किताबें जोड़ना बेहद सरल है। `content/raw/` फ़ोल्डर में एक नई `.md` (Markdown) फ़ाइल बनाएँ:

```markdown
---
id: "idgah"
title: "ईदगाह"
title_en: "Idgah"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी"
category_en: "Short Story"
published_year: 1933
description: "हामिद और उसकी बूढ़ी दादी अमीना के बीच वात्सल्य और चिमटे की अमर कहानी।"
keywords: ["idgah", "hamid", "amina", "chimta", "premchand", "kahani"]
---

# अध्याय १

रमज़ान के पूरे तीस रोज़ों के बाद आज ईद आई है। कितना मनोहर, कितना सुहावना प्रभाव है...

# अध्याय २

गाँव से मेला चला और बच्चों के साथ हामिद भी जा रहा था...
```

फ़ाइल सहेजने के बाद बस चलाएँ:
```bash
npm run ingest
```
स्क्रिप्ट स्वचालित रूप से:
1. टेक्स्ट को **Unicode NFC** में सामान्यीकृत करेगी ताकि कोई मात्रा या संयुक्त अक्षर न टूटे।
2. पैराग्राफ़ ब्लॉक्स का JSON बनाएगी।
3. `public/content/library.json` और `public/sitemap.xml` को अपडेट कर देगी।

---

## 🚢 परिनियोजन (Deployment)

### 1. GitHub Pages (Day 1)
रिपॉजिटरी में `.github/workflows/deploy.yml` पहले से कॉन्फ़िगर है:
1. कोड को GitHub रिपॉजिटरी में पुश करें।
2. रिपॉजिटरी की **Settings** > **Pages** में जाएँ।
3. **Build and deployment > Source** में **GitHub Actions** चुनें।
4. हर `git push` पर साइट अपने-आप पब्लिश हो जाएगी!

### 2. Cloudflare Pages पर माइग्रेट करना (Future)
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) में **Workers & Pages** पर जाएँ।
2. **Create Application** > **Pages** > **Connect to Git** चुनें।
3. बिल्ड सेटिंग्स:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
4. 'Save and Deploy' पर क्लिक करें। 

---

## 📜 लाइसेंस
सभी शामिल पुस्तकें सार्वजनिक डोमेन (Public Domain) हैं।
स्रोत कोड MIT लाइसेंस के तहत उपलब्ध है।

