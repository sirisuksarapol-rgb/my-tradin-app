import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.login import login_bp
from routes.verify import verify_bp
from routes.register import register_bp
from routes.category import category_bp
from routes.item import item_bp
from routes.exchanges import exchanges_bp 
from routes.notifications import notifications_bp
from routes.users import users_bp
from routes.reports import report_bp 
from routes.matches import match_bp
from routes.admin import admin_bp 

app = Flask(__name__)
CORS(app) 

database_url = os.environ.get('DATABASE_URL')


app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'supersecret123')

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
 os.makedirs(UPLOAD_FOLDER)

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
 return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

app.register_blueprint(login_bp)
app.register_blueprint(verify_bp)
app.register_blueprint(register_bp)
app.register_blueprint(category_bp)
app.register_blueprint(item_bp) 
app.register_blueprint(notifications_bp)
app.register_blueprint(users_bp)
app.register_blueprint(exchanges_bp) 
app.register_blueprint(report_bp) 
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(match_bp)

if __name__ == "__main__":
 app.run(host="0.0.0.0", port=5000, debug=True)