import os
import json
import threading
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

# Global Leaderboard & Referral Store
global_leaderboard = [
    {"name": "KoteTrader 🐱", "score": "5.40 SOL"}
]

users_db = set()
referrals_db = {}  # {referrer_id: [referred_user_id, ...]}

# --- 1. RENDER HEALTH CHECK & API SERVER ---
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path == "/api/leaderboard":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(global_leaderboard).encode("utf-8"))
            return
            
        if parsed_url.path == "/api/referrals":
            query_params = parse_qs(parsed_url.query)
            user_id = query_params.get("user_id", [None])[0]
            count = len(referrals_db.get(user_id, [])) if user_id else 0
            referred_list = referrals_db.get(user_id, [])
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "user_id": user_id, 
                "referral_count": count, 
                "referred_users": referred_list
            }).encode("utf-8"))
            return
            
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Kote Trading & Sniper Bot is live 24/7!")
    
    def do_POST(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path == "/api/submit":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                name = data.get("name")
                score = data.get("score")
                
                if name and score:
                    global_leaderboard.append({"name": name, "score": score})
                    global_leaderboard.sort(key=lambda x: float(x["score"].split()[0]), reverse=True)
                    if len(global_leaderboard) > 50:
                        global_leaderboard.pop()
                        
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success"}).encode("utf-8"))
                    return
            except Exception as e:
                logger.error(f"Error saving data: {e}")
                
            self.send_response(400)
            self.end_headers()
            return

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def log_message(self, format, *args):
        return

def run_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    server.serve_forever()

# --- 2. TELEGRAM BOT COMMAND HANDLERS ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_id = str(user.id)
    
    # Instant Referral Tracking on bot load (t.me/bot?start=ref_12345678)
    if context.args and context.args[0].startswith("ref_"):
        referrer_id = context.args[0].replace("ref_", "")
        if referrer_id != user_id:
            if referrer_id not in referrals_db:
                referrals_db[referrer_id] = []
            if user_id not in referrals_db[referrer_id]:
                referrals_db[referrer_id].append(user_id)
                logger.info(f"Instant Referral Tracked: User {user_id} referred by {referrer_id}")

    users_db.add(user_id)

    welcome_text = f"""<b>🐱 Welcome to Kote Trading & Sniper Bot, {user.first_name}!</b>

Your ultimate companion for automated token sniping, wallet management, and decentralized trading on Telegram.
Tap below to launch your trading dashboard mini-app!"""
    
    webapp_url = "https://ewanh275-art.github.io/kote-trading-bot/"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📊 Open Trading Dashboard 🚀", web_app=WebAppInfo(url=webapp_url))]
    ])
    
    await update.message.reply_text(welcome_text, parse_mode="HTML", reply_markup=keyboard)

async def trade_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    bot_username = "KoteCrashBot" 
    direct_link = f"https://t.me/{bot_username}"
    
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("⚡ Open Sniper & Trading Hub", url=direct_link)]
    ])
    
    await update.message.reply_text(
        "🎯 <b>Kote Trading & Sniper Hub Ready!</b>\n\nClick below to open your dashboard, manage connected wallets, and execute fast snipes!",
        parse_mode="HTML",
        reply_markup=keyboard
    )

# --- 3. MAIN APPLICATION STARTUP ---
def main():
    TOKEN = os.environ.get("BOT_TOKEN") or os.environ.get("TELEGRAM_TOKEN")
    if not TOKEN:
        logger.error("CRITICAL: No BOT_TOKEN or TELEGRAM_TOKEN environment variable found. Please configure it in Render settings.")
        return

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    application = ApplicationBuilder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("trade", trade_command))
    application.add_handler(CommandHandler("sniper", trade_command))

    logger.info("Starting Kote Trading & Sniper Bot polling...")
    application.run_polling()

if __name__ == "__main__":
    main()
