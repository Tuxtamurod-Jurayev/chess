import https from 'node:https';
import dns from 'node:dns';

export interface TelegramBotConfig {
  token: string;
  webappUrl: string;
}

const fallbackResolver = new dns.promises.Resolver();
fallbackResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

export class TelegramBotService {
  private token: string;
  private webappUrl: string;
  private isPolling = false;
  private offset = 0;
  private botUsername = 'my_game001_bot';
  private activeChatIds = new Set<number>();
  private lastBroadcastTime = 0;

  constructor(config: TelegramBotConfig) {
    this.token = config.token;
    this.webappUrl = config.webappUrl;
  }

  public async start() {
    if (!this.token) {
      console.warn('⚠️ [TelegramBot] TELEGRAM_BOT_TOKEN berilmagan. Bot ishga tushmadi.');
      return;
    }

    // Connect with retry
    let meRes: any = null;
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        meRes = await this.apiCall('getMe');
        if (meRes && meRes.ok) break;
      } catch (err: any) {
        console.warn(`⏳ [TelegramBot] Ulanish kutilmoqda (${attempt}/10): ${err.message || err}`);
        await new Promise((r) => setTimeout(r, 2500));
      }
    }

    if (!meRes || !meRes.ok) {
      console.error('❌ [TelegramBot] Telegram API ga ulanib bo‘lmadi:', meRes);
      return;
    }

    try {
      if (!this.webappUrl && process.env.RENDER_EXTERNAL_URL) {
        this.webappUrl = process.env.RENDER_EXTERNAL_URL;
      }
      this.botUsername = meRes.result.username || 'my_game001_bot';
      console.log(`🤖 [TelegramBot] Muvaffaqiyatli ulandi: @${this.botUsername} (${meRes.result.first_name})`);

      // 2. Drop pending updates and clear any webhook
      await this.apiCall('deleteWebhook', { drop_pending_updates: true });

      // 3. Set bot commands
      await this.apiCall('setMyCommands', {
        commands: [
          { command: 'start', description: '🎮 O‘yinlar portalini ochish' },
          { command: 'games', description: '🕹️ 8 ta o‘yinlar ro‘yxati' },
          { command: 'help', description: 'ℹ️ Qo‘llanma va yordam' },
        ],
      });

      // 4. Set Chat Menu Button (Native "Boshlash" button in Telegram chat bar)
      if (this.webappUrl && this.webappUrl.startsWith('https://')) {
        await this.apiCall('setChatMenuButton', {
          menu_button: {
            type: 'web_app',
            text: '🚀 Boshlash',
            web_app: { url: this.webappUrl },
          },
        });
        console.log(`🔘 [TelegramBot] Chat menyu tugmasi o‘rnatildi: ${this.webappUrl}`);
      }

      // 5. Start long polling
      this.isPolling = true;
      this.pollUpdates();
      console.log('⚡ [TelegramBot] Long-polling xabarlarni qabul qilishga tayyor!');
    } catch (err) {
      console.error('❌ [TelegramBot] Botni sozlashda xatolik:', err);
    }
  }

  public setWebappUrl(url: string) {
    this.webappUrl = url;
    if (this.webappUrl && this.webappUrl.startsWith('https://')) {
      this.apiCall('setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: '🚀 Boshlash',
          web_app: { url: this.webappUrl },
        },
      }).catch((e) => console.warn('setChatMenuButton error:', e));
    }
  }

  public registerChatId(chatId: number) {
    if (chatId) this.activeChatIds.add(chatId);
  }

  public async broadcastGameInvite(hostName: string, gameId: string, excludeTgId?: number, challengeId?: string) {
    const now = Date.now();
    // 25 second cooldown to avoid spamming
    if (now - this.lastBroadcastTime < 25000) return;
    this.lastBroadcastTime = now;

    const gameNames: Record<string, string> = {
      chess: 'Shaxmat (Chess)',
      checkers: 'Shashka (Checkers)',
      tictactoe: 'Tic-Tac-Toe',
      'math-battle': 'Matematik Duel',
    };
    const gameName = gameNames[gameId] || 'O‘yin';
    const webAppUrl = this.getAppUrl(challengeId ? `challenge_${challengeId}` : `join_${gameId}`);

    const message = `♟️ <b>${gameName} o‘yiniga taklif!</b>\n\n` +
      `<b>${hostName}</b> ayni daqiqalarda sizni 1v1 onlayn o‘yiniga taklif qilmoqda!\n\n` +
      `Qo‘shilish uchun quyidagi tugmani bosing 👇`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: `⚔️ O‘yinga qo‘shilish (${gameName})`,
            web_app: { url: webAppUrl },
          },
        ],
      ],
    };

    console.log(`[TelegramBot] Broadcasting invite for ${gameName} from ${hostName} to ${this.activeChatIds.size} users`);

    for (const chatId of this.activeChatIds) {
      if (excludeTgId && chatId === excludeTgId) continue;
      try {
        await this.sendMessage(chatId, message, replyMarkup);
      } catch (err: any) {
        console.warn(`[TelegramBot] Failed sending invite to ${chatId}:`, err.message || err);
      }
    }
  }

  public stop() {
    this.isPolling = false;
  }

  private async pollUpdates() {
    while (this.isPolling) {
      try {
        const res = await this.apiCall('getUpdates', {
          offset: this.offset,
          timeout: 25,
          allowed_updates: ['message', 'callback_query'],
        });

        if (res.ok && Array.isArray(res.result)) {
          for (const update of res.result) {
            this.offset = update.update_id + 1;
            await this.handleUpdate(update);
          }
        } else if (!res.ok) {
          const desc = res.description || '';
          if (desc.includes('Conflict') || desc.includes('409')) {
            console.warn('⚠️ [TelegramBot] Boshqa nusxa (instance) faol. 8 soniya kutilmoqda...');
            await new Promise((r) => setTimeout(r, 8000));
          } else {
            console.warn('⚠️ [TelegramBot] getUpdates javobi:', desc);
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('⚠️ [TelegramBot] Polling xatosi:', err.message || err);
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
    }
  }

  private async handleUpdate(update: any) {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat?.id;
      const text = (msg.text || '').trim();
      const firstName = msg.from?.first_name || 'Geymer';

      if (!chatId) return;
      this.activeChatIds.add(chatId);

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1] : '';
        await this.sendWelcomeMessage(chatId, firstName, startParam);
      } else if (text === '/games') {
        await this.sendGamesList(chatId);
      } else if (text === '/help') {
        await this.sendHelp(chatId);
      } else {
        await this.sendDefaultResponse(chatId, firstName);
      }
    }
  }

  private getAppUrl(param?: string): string {
    const base = this.webappUrl || process.env.RENDER_EXTERNAL_URL || 'https://resulting-llc-describing-offered.trycloudflare.com';
    if (!param) return base;
    return base.includes('?') ? `${base}&startapp=${param}` : `${base}?startapp=${param}`;
  }

  private async sendWelcomeMessage(chatId: number, firstName: string, startParam?: string) {
    const webAppUrl = this.getAppUrl(startParam);

    const message = `🎮 <b>Assalomu alaykum, ${firstName}!</b>\n\n` +
      `<b>"MY Game" Mini-O‘yinlar Portali</b>ga xush kelibsiz! 🕹️\n\n` +
      `O‘yinlarni boshlash uchun quyidagi tugmani bosing 👇`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Boshlash',
            web_app: { url: webAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, message, replyMarkup);
  }

  private async sendGamesList(chatId: number) {
    const webAppUrl = this.getAppUrl();

    const message = `🕹️ <b>Platformadagi 8 ta o‘yin ro‘yxati:</b>\n\n` +
      `1. ♟️ <b>Shaxmat (Chess):</b> 1v1 PvP yoki Minimax AI (Easy/Medium/Hard)\n` +
      `2. ⚪ <b>Shashka (Checkers):</b> Damkaga chiqish, orqaga urish qoidalari\n` +
      `3. 🎯 <b>Knife Hit:</b> Har bir bosqichda pichoq va nishon diski o‘zgaruvchi arkada\n` +
      `4. 🌲 <b>Timberjack:</b> Reaksiya tezligi va daraxt kesish\n` +
      `5. 🔢 <b>2048:</b> Plitkalarni surib 2048 soniga erishish\n` +
      `6. ❌ <b>Tic-Tac-Toe:</b> Krestiki-noliki tezkor partiyalari\n` +
      `7. 🏗️ <b>Tower Blocks:</b> Osmondo‘par binolar qurish\n` +
      `8. ➕ <b>Math Battle:</b> Matematik misollarni yechish bellashuvi\n\n` +
      `👇 <i>Istalgan birini darhol o‘ynash uchun:</i>`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '▶️ Portalga kirish va o‘ynash',
            web_app: { url: webAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, message, replyMarkup);
  }

  private async sendHelp(chatId: number) {
    const webAppUrl = this.getAppUrl();

    const message = `ℹ️ <b>Qo‘llanma va Qoidalar:</b>\n\n` +
      `🪙 <b>Tangalar (Coins) qanday olinadi?</b>\n` +
      `• Har kuni portalga kirib <b>Kunlik bonus</b>ni oling (Streak oshib boradi);\n` +
      `• Solo o‘yinlarda yuqori ball to‘plang (+10..50 tanga);\n` +
      `• Bellashuvlarda g‘alaba qozoning!\n\n` +
      `⚔️ <b>1v1 Onlayn bellashuv:</b>\n` +
      `• Shaxmat, Shashka yoki Tic-Tac-Toe o‘yinlarida "1v1 Onlayn" tugmasini bosing;\n` +
      `• Matchmaking orqali tasodifiy raqib bilan yoki to‘g‘ridan-to‘g‘ri do‘stingizga xona ssilkasi yuborib bellashing!\n\n` +
      `Savollar yoki takliflar bo‘lsa, adminlar bilan bog‘laning.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🎮 Portalni ochish',
            web_app: { url: webAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, message, replyMarkup);
  }

  private async sendDefaultResponse(chatId: number, firstName: string) {
    const webAppUrl = this.getAppUrl();

    const message = `Salom, <b>${firstName}</b>! 👋\n\n` +
      `O‘yinlar portalini ochish uchun <b>«🚀 Boshlash»</b> tugmasini bosing 👇`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🚀 Boshlash',
            web_app: { url: webAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, message, replyMarkup);
  }

  private async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    return this.apiCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }

  private async apiCall(method: string, body?: any): Promise<any> {
    const postData = body ? JSON.stringify(body) : '';

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${this.token}/${method}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        lookup: (hostname, opts, cb) => {
          const callback = typeof opts === 'function' ? opts : cb;
          dns.lookup(hostname, opts as any, (err, address, family) => {
            if (!err && address) {
              return callback(null, address as any, family);
            }
            const isAll = typeof opts === 'object' && opts && (opts as any).all;
            fallbackResolver
              .resolve4(hostname)
              .then((addrs) => {
                if (isAll) {
                  callback(null, addrs.map((a) => ({ address: a, family: 4 })) as any);
                } else {
                  callback(null, addrs[0] as any, 4);
                }
              })
              .catch((fallbackErr) => callback(fallbackErr, '', 4));
          });
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve({ ok: false, description: raw });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(35000, () => {
        req.destroy(new Error('Telegram API request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}
