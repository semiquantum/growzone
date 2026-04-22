from flask import Flask, render_template, request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import datetime

app = Flask(__name__)

# Google Calendar API scopes
SCOPES = ['https://www.googleapis.com/auth/calendar']

# OAuth flow
flow = InstalledAppFlow.from_client_secrets_file( "D:\GrowZone\Google meet\credentials.json", SCOPES)
creds = flow.run_local_server(port=0)
service = build('calendar', 'v3', credentials=creds)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create_meet', methods=['POST'])
def create_meet():
    event_name = request.form['name']
    description = request.form.get('description', '')

    # Start time = now, End time = 1 hour later
    start = datetime.datetime.utcnow()
    end = start + datetime.timedelta(hours=1)

    event = {
        'summary': event_name,
        'description': description,
        'start': {'dateTime': start.isoformat() + 'Z', 'timeZone': 'UTC'},
        'end': {'dateTime': end.isoformat() + 'Z', 'timeZone': 'UTC'},
        'conferenceData': {'createRequest': {'requestId': 'growzone123'}},
    }

    created_event = service.events().insert(
        calendarId='primary',
        body=event,
        conferenceDataVersion=1
    ).execute()

    meet_link = created_event['conferenceData']['entryPoints'][0]['uri']
    return f'<h2>Google Meet Link:</h2><a href="{meet_link}" target="_blank">{meet_link}</a>'

if __name__ == '__main__':
    app.run(debug=True)
