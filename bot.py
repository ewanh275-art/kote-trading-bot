import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

users_db = set()
referrals_db = {}  # {referrer_id: [referred_user_id, ...]}
clicks_db = {}     # {referrer_id: click_count}

# --- TELEGRAM BOT COMMAND HANDLERS ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_id = str(user.id)
    
    # Real-Time Referral Tracking on bot load (t.me/KoteTrade_bot?start=ref_12345678)
    if context.args and context.args[0].startswith("ref_"):
        referrer_id = context.args[0].replace("ref_", "")
        if referrer_id != user_id:
            if referrer_id not in clicks_db:
                clicks_db[referrer_id] = 0
            clicks_db[referrer_id] += 1

            if referrer_id not in referrals_db:
                referrals_db[referrer_id] = []
            if user_id not in referrals_db[referrer_id]:
                referrals_db[referrer_id].append(user_id)
                logger.info(f"✅ Real-Time Referral Registered: User {user_id} referred by {referrer_id} (Total clicks: {clicks_db[referrer_id]})")

    users_db.add(user_id)

    welcome_text = f"""<b>🐱 Welcome to Kote Trading & Sniper Bot, {user.first_name}!</b>

Your ultimate companion for automated token sniping, wallet management, and decentralized trading on Telegram.
Tap below to launch your trading dashboard mini-app!"""
    
    # Points directly to your unified Render cloud app
    webapp_url = "https://kote-trading-bot.onrender.com/"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Open Kote Terminal 🚀", web_app=WebAppInfo(url=webapp_url))]
    ])
    
    await update.message.reply_text(welcome_text, parse_mode="HTML", reply_markup=keyboard)

async def trade_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_username = "KoteTrade_bot" 
    direct_link = f"https://t.me/{bot_username}"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("⚡ Open Sniper & Trading Hub", url=direct_link)]
    ])
    
    await update.message.reply_text(
        "🎯 <b>Kote Trading & Sniper Hub Ready!</b>\n\nClick below to open your dashboard, manage connected wallets, and execute fast snipes!",
        parse_mode="HTML",
        reply_markup=keyboard
    )

# --- MAIN APPLICATION STARTUP ---
def main():
    TOKEN = os.environ.get("BOT_TOKEN") or os.environ.get("TELEGRAM_TOKEN")
    if not TOKEN:
        logger.error("CRITICAL: No BOT_TOKEN or TELEGRAM_TOKEN environment variable found. Please configure it in Render settings.")
        return

    application = ApplicationBuilder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("trade", trade_command))
    application.add_handler(CommandHandler("sniper", trade_command))

    logger.info("Starting @KoteTrade_bot polling with active referral hooks...")
    application.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
