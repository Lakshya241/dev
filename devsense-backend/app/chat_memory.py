import uuid

CHAT_SESSIONS = {}


def create_session():
    session_id = str(uuid.uuid4())
    CHAT_SESSIONS[session_id] = []
    return session_id


def add_message(session_id, role, content):
    if session_id in CHAT_SESSIONS:
        CHAT_SESSIONS[session_id].append({
            "role": role,
            "content": content
        })


def get_history(session_id):
    return CHAT_SESSIONS.get(session_id, [])