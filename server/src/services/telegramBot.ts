export interface TelegramBotConfig {
  token: string;
  webappUrl: string;
}

export class TelegramBotService {
  private token: string;
  private webappUrl: string;
  private isPolling = false;
  private offset = 0;
  private botUsername = 'my_game001_bot';

  constructor(config: TelegramBotConfig) {
    this.token = config.token;
    this.webappUrl = config.webappUrl;
  }

  public async start() {
    if (!this.token) {
      console.warn('⚠️ [TelegramBot] TELEGRAM_BOT_TOKEN berilmagan. Bot ishga tushmadi.');
      return;
    }

    try {
      // 1. Get bot information
      const meRes = await this.apiCall('getMe');
      if (meRes.ok) {
        this.botUsername = meRes.result.username || 'my_game001_bot';
        console.log(`🤖 [TelegramBot] Muvaffaqiyatli ulandi: @${this.botUsername} (${meRes.result.first_name})`);
      } else {
        console.error('❌ [TelegramBot] getMe xatosi:', meRes);
        return;
      }

      // 2. Drop pending updates and clear any webhook
      await this.apiCall('deleteWebhook', { drop_pending_updates: true });

      // 3. Set bot commands
      await this.apiCall('setMyCommands', {
        commands: [
          { command: 'start', description: '🎮 O‘yinlar portalini ochish' },
          { command: 'games', description: '🕹️ 10 ta o‘yinlar ro‘yxati' },
          { command: 'help', description: 'ℹ️ Qo‘llanma va yordam' },
        ],
      });

      // 4. Set Chat Menu Button (Native "O'ynash" button in Telegram chat bar)
      if (this.webappUrl && this.webappUrl.startsWith('https://')) {
        await this.apiCall('setChatMenuButton', {
          menu_button: {
            type: 'web_app',
            text: '🎮 O‘ynash',
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
      console.error('❌ [TelegramBot] Botni ishga tushirishda xatolik:', err);
    }
  }

  public setWebappUrl(url: string) {
    this.webappUrl = url;
    if (this.webappUrl && this.webappUrl.startsWith('https://')) {
      this.apiCall('setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: '🎮 O‘ynash',
          web_app: { url: this.webappUrl },
        },
      }).catch((e) => console.warn('setChatMenuButton error:', e));
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
          console.warn('⚠️ [TelegramBot] getUpdates javobi:', res.description);
          await new Promise((r) => setTimeout(r, 3000));
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
    const base = this.webappUrl || 'https://my-game001-bot.loca.lt';
    if (!param) return base;
    return base.includes('?') ? `${base}&startapp=${param}` : `${base}?startapp=${param}`;
  }

  private async sendWelcomeMessage(chatId: number, firstName: string, startParam?: string) {
    const webAppUrl = this.getAppUrl(startParam);

    const message = `🎮 <b>Assalomu alaykum, ${firstName}!</b>\n\n` +
      `<b>"MY Game" Telegram Mini-O‘yinlar Portali</b>ga xush kelibsiz! 🚀\n\n` +
      `Bu yerda siz <b>10 xil qiziqarli o‘yin</b>da do‘stlaringiz bilan (1v1 PvP) yoki aqlli botga qarshi bellashishingiz, ELO reytingingizni oshirishingiz va tangalar to‘plashingiz mumkin.\n\n` +
      `🏆 <b>Mavjud o‘yinlar:</b>\n` +
      `♟️ <b>Shaxmat</b> — Taktik FIDE qoidalari & Minimax AI\n` +
      `⚪ <b>Shashka</b> — Klassik 8x8 maydon\n` +
      `🎯 <b>Knife Hit</b> — 5 bosqichli realistik pichoq uloqtirish\n` +
      `🌲 <b>Timberjack</b> — Daraxt kesish & shoxlardan qochish\n` +
      `🔢 <b>2048</b> — Mantiqiy puzzle\n` +
      `🐍 <b>Snake</b> — Klassik iloncha sarguzashti\n` +
      `❌ <b>Tic-Tac-Toe</b> — 1v1 tezkor duel\n` +
      `🏗️ <b>Tower Blocks</b> — Baland minora qurish\n` +
      `🔤 <b>Wordle</b> — So‘z topish krossvordi\n` +
      `➕ <b>Math Battle</b> — Arifmetik tezlik bellashuvi\n\n` +
      `👇 <i>O‘yinni boshlash uchun quyidagi tugmani bosing:</i>`;

    const replyMarkup: any = {
      inline_keyboard: [
        [
          {
            text: '🎮 O‘yinlar portalini ochish',
            web_app: { url: webAppUrl },
          },
        ],
        [
          {
            text: '👥 Do‘stlarni taklif qilish',
            url: `https://t.me/share/url?url=https://t.me/${this.botUsername}?startapp=ref_${chatId}&text=Men%20bilan%20Telegram%20o%E2%80%98yinlarida%20bellashing!`,
          },
        ],
        [
          {
            text: '🕹️ 10 ta o‘yinlar ro‘yxati',
            callback_data: 'show_games',
          },
        ],
      ],
    };

    await this.sendMessage(chatId, message, replyMarkup);
  }

  private async sendGamesList(chatId: number) {
    const webAppUrl = this.getAppUrl();

    const message = `🕹️ <b>Platformadagi 10 ta o‘yin ro‘yxati:</b>\n\n` +
      `1. ♟️ <b>Shaxmat (Chess):</b> 1v1 PvP yoki Minimax AI (Easy/Medium/Hard)\n` +
      `2. ⚪ <b>Shashka (Checkers):</b> Damkaga chiqish, orqaga urish qoidalari\n` +
      `3. 🎯 <b>Knife Hit:</b> Har bir bosqichda pichoq va nishon diski o‘zgaruvchi arkada\n` +
      `4. 🌲 <b>Timberjack:</b> Reaksiya tezligi va daraxt kesish\n` +
      `5. 🔢 <b>2048:</b> Plitkalarni surib 2048 soniga erishish\n` +
      `6. 🐍 <b>Snake:</b> Ozuqa yeb eng uzun ilon bo‘lish\n` +
      `7. ❌ <b>Tic-Tac-Toe:</b> Krestiki-noliki tezkor partiyalari\n` +
      `8. 🏗️ <b>Tower Blocks:</b> Gorizontal harakatlanuvchi bloklardan minora qurish\n` +
      `9. 🔤 <b>Wordle:</b> 5 harfli yashirin so‘zni 6 urinishda topish\n` +
      `10. ➕ <b>Math Battle:</b> Matematik misollarni vaqtga qarshi yechish\n\n` +
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
      `• Do‘stlaringizni taklif qiling (+100 tanga har bir do‘st uchun).\n\n` +
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

    const message = `Salom, <b>${firstName}</b>! 👋\n` +
      `O‘yinlarni boshlash uchun quyidagi tugmani bosing yoki /start buyrug‘ini yuboring.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🎮 O‘yinlarni boshlash',
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

  private async apiCall(method: string, body?: any) {
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }
}
