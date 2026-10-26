# 🎮 Telegram Ko‘p Foydalanuvchili Mini-O‘yinlar Portali (TMA)

Telegram platformasi (Telegram Mini Apps / WebApp) uchun 10 xil o‘yinni o‘z ichiga olgan, 1v1 PvP va Botga qarshi o‘ynash imkoniyati, ELO reyting tizimi, kunlik bonuslar va tangalar iqtisodiyotiga ega ko‘ngilochar gaming-portal.

---

## 🚀 Texnologik Stak

- **Frontend (TMA):** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend & Real-Time:** Node.js, Express, Socket.io, `chess.js` (FIDE qoidalari va harakatlarni serverda tekshirish).
- **Telegram Integratsiyasi:** Telegram WebApp SDK (`Telegram.WebApp.initData` HMAC-SHA256 xavfsiz avtorizatsiya, Haptic Feedback, Telegram Theme moslashuvi).

---

## 🕹️ 10 Ta O‘yinlar Ro‘yxati va Holati

| № | O‘yin | Format | Xususiyatlar |
|---|---|---|---|
| **1** | **Chess (Shaxmat)** | 1v1 PvP, Bot (Easy/Medium/Hard), Lokal | FIDE qoidalari, taymer (3/5/10 min), ELO reytingi, SVG donalar |
| **2** | **Checkers (Shashka)** | 1v1 PvP va Botga qarshi | 8x8 maydon, orqaga urish va damkaga chiqish |
| **3** | **Math Battle** | Tezkor arifmetik duel va solo | Ketma-ket combo x2-x5, tezkor hisoblash |
| **4** | **Timberjack** | Solo Arcade rekord | O‘ng va chapga tezkor zarbalar, shoxlardan qochish |
| **5** | **2048 Puzzle** | Solo Puzzle | 4x4 panjara, touch surish va animatsiyalar |
| **6** | **Tic-Tac-Toe** | 1v1 va Bot (3x3 hamda 5x5) | Klassik va Gomoku strategik rejimi |
| **7** | **Snake (Iloncha)** | Solo retro arcade | Tezkor ozuqalar, grid boshqaruvi va rekordlar |
| **8** | **Wordle** | Solo va 1v1 kunlik so‘z topish | 5 harfli o‘zbekcha so‘zlar, virtual klaviatura |
| **9** | **Knife Hit** | Solo bosqichma-bosqich | Aylanayotgan nishonga pichoq uloqtirish |
| **10**| **Tower Blocks** | Solo rekord minora | Gorizontal harakatlanuvchi bloklarni kesish |

---

## 📂 Loyiha Strukturasi

```text
chess/
├── client/                     # Telegram Mini App Frontend
│   ├── src/
│   │   ├── components/         # Header, BottomNav, Modallar, GameCard
│   │   ├── games/              # 10 ta o'yin komponentlari (chess, checkers, 2048, ...)
│   │   ├── pages/              # PortalHome, Leaderboard, Friends, Profile
│   │   ├── services/           # telegram.ts, socket.ts, api.ts
│   │   ├── store/              # Zustand appStore (coins, elo, user)
│   │   └── types.ts            # Frontend tiplari
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend REST API & Real-time WebSocket
│   ├── src/
│   │   ├── services/store.ts   # In-memory DB, ELO, tangalar va statistika
│   │   ├── sockets/            # RoomManager (ChessEngine), MatchmakingQueue
│   │   ├── utils/telegramAuth  # HMAC-SHA256 initData tekshiruvi
│   │   └── index.ts            # Express & Socket.io server (Port 3001)
│   ├── package.json
│   └── tsconfig.json
│
└── shared/                     # Umumiy tiplar va konstantalar
```

---

## ⚡ Qanday Ishga Tushiriladi?

### 1. Bog‘liqliklarni o‘rnatish:
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Dasturni bir vaqtda ishga tushirish (Frontend + Backend):
```bash
npm run dev
```

- **Frontend (TMA):** `http://localhost:5173`
- **Backend API & WebSocket:** `http://localhost:3001`

---

## 🤖 Telegram Botga Ulash

1. [@BotFather](https://t.me/BotFather) orqali yangi bot yarating (yoki mavjud botingizdan foydalaning).
2. BotFather'da `/newapp` buyrug‘ini yuboring.
3. WebApp URL manzilini ko‘rsating (masalan, `https://your-domain.ngrok-free.app` yoki hosting domeningiz).
4. `server/.env` faylida bot tokenini sozlang:
   ```env
   TELEGRAM_BOT_TOKEN="your_bot_token_here"
   PORT=3001
   ```
