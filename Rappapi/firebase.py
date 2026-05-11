import firebase_admin
from firebase_admin import credentials, db, auth

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

##################################################
def get_or_create_chat_room(customer_id, chef_id):
    room_id = f"customer_{customer_id}_chef_{chef_id}"
    ref = db.reference(f'chats/{room_id}/info')
    if not ref.get():
        ref.set({
            'customer_id': customer_id,
            'chef_id': chef_id,
            'last_message': '',
            'created_at': {'.sv': 'timestamp'}
        })
    return room_id

def send_chat_message(room_id, sender_id, sender_role, text):
    messages_ref = db.reference(f'chats/{room_id}/messages')
    new_msg = messages_ref.push({
        'sender_id': sender_id,
        'sender_role': sender_role,
        'text': text,
        'timestamp': {'.sv': 'timestamp'}
    })

    db.reference(f'chats/{room_id}/info').update({
        'last_message': text
    })
    return new_msg.key

def get_chat_messages(room_id, limit=50):
    ref = db.reference(f'chats/{room_id}/messages')
    data = ref.order_by_child('timestamp').limit_to_last(limit).get()
    if not data:
        return []
    return [{'id': k, **v} for k, v in data.items()]

def get_chef_rooms(chef_id):
    ref = db.reference('chats')
    all_rooms = ref.get()
    if not all_rooms:
        return []
    result = []
    for room_id, room_data in all_rooms.items():
        if f'chef_{chef_id}' in room_id:
            info = room_data.get('info', {})
            result.append({
                'room_id':      room_id,
                'customer_id':  info.get('customer_id'),
                'last_message': info.get('last_message', ''),
            })
    return result
