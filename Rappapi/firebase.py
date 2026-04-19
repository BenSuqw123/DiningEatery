import firebase_admin
from firebase_admin import credentials, db

if not firebase_admin._apps:
    cred = credentials.Certificate("diningapp-9b1aa-firebase-adminsdk-fbsvc-ec017bebec.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://diningapp-9b1aa-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })

def update_firebase_table(table_id, status, total_price):
    ref = db.reference(f'restaurant/tables/table_{table_id}')
    ref.update({
        'status': status,
        'total_price': total_price
    })

def get_firebase_table(table_id):
    ref = db.reference(f'restaurant/tables/table_{table_id}')
    return ref.get()