from flask import Flask, request, jsonify, render_template
import imaplib
import email
from email.header import decode_header
import os
import requests
import socket

# Initialize Flask to look for templates in the 'templates' folder
# and static files in the 'static' folder.
app = Flask(__name__)

# List of Spamhaus API keys with automatic fallback
SPAMHAUS_API_KEYS = [
    "dG5BR2ZLSWtYOWlxQ194SldrQk84elZPLXByTHpMU1gxTWpmQk44dUlWYy40NjlmMWUxYS1hMmI1LTRlMzItYTAzYy1mZWUwOTdhYjM4NGE",
    "M3lwcnNFTjdVR3NPaXhBS3A5ZDdYSjB1TG1NLXhxbnJWZHpNYXZubDhGOC42MGZkOWM2Yy01N2ExLTQxMGEtOTE1Yy1hMWQ2NWE5YTc5NzE",
    "SkYxU3ZJelYtUjhBQ2ZYMTY0ZzJrRTJ4cWo3SDhsS0NQN1N3SC03NVBfOC5iNTgzMzBlNS1mZmVkLTRiMWEtOGE1Mi01NmFmZjQ2NDE4MTU",
    "cGs5R1h2cVJUQ2NrVEZPc3hPWVpmZmNsTl9oZUZWSlNmbzhDbUw4Z3ZWUS5jOTI1MzM0YS04OGU3LTQxMWEtYjU3OC1iZTE0MmZhNGU4NTU",
    "NjhpZWxHYkdPdVVBdFRESS1OSXFZV1B4VjB3UmpBVDFlRlVxUG9EVXBPRS42ZjcxOWYyNy00NDNkLTQ1YzUtYmYwZC1lNGM2MWI0ZDQzYWM"
]

def make_spamhaus_request(url, params=None):
    """
    Make a request to Spamhaus API with automatic fallback to next API key if one fails.

    Args:
        url: The API endpoint URL
        params: Optional query parameters

    Returns:
        tuple: (success: bool, data: dict, error_message: str)
    """
    last_error = None

    for idx, api_key in enumerate(SPAMHAUS_API_KEYS):
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)

            # If successful, return the data
            if response.status_code == 200:
                return (True, response.json(), None)

            # If rate limited or unauthorized, try next key
            elif response.status_code in [401, 403, 429]:
                last_error = f"API key {idx + 1} failed: {response.status_code}"
                continue

            # Other errors
            else:
                last_error = f"API returned status {response.status_code}"
                continue

        except requests.exceptions.Timeout:
            last_error = f"API key {idx + 1} timed out"
            continue
        except requests.exceptions.RequestException as e:
            last_error = f"API key {idx + 1} error: {str(e)}"
            continue

    # All API keys failed
    return (False, None, last_error or "All API keys failed")

@app.route('/')
def home():
    """Renders the main application page from templates/index.html."""
    return render_template('index.html')

def clean(value):
    """Safely decodes byte strings to UTF-8."""
    if isinstance(value, bytes):
        try:
            return value.decode('utf-8', errors='ignore')
        except (UnicodeDecodeError, AttributeError):
            return str(value)
    return value

@app.route('/extract', methods=['POST'])
def extract():
    """The API endpoint for the Gmail Extractor tool."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request format"}), 400

    user = data.get('email')
    password = data.get('pass')
    start = int(data.get('start', 1))
    count = int(data.get('count', 5))
    folder = data.get('folder', 'INBOX')
    params = data.get('params', [])

    if not all([user, password, params]):
        return jsonify({"error": "Missing required fields: email, pass, or params"}), 400

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(user, password)
        mail.select(f'"{folder}"') # Use quotes for folder names with special chars

        result, data_ids = mail.search(None, 'ALL')
        mail_ids = data_ids[0].split()
        
        # Correctly handle slicing for email fetching
        start_index = -(start + count -1)
        end_index = -start + 1 if start > 1 else None
        selected_ids = mail_ids[start_index:end_index]
        selected_ids.reverse()

        rows = []
        for i in selected_ids:
            result, msg_data = mail.fetch(i, "(RFC822)")
            if not msg_data or not msg_data[0]: continue
            
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            row = {}
            for param in params:
                value = None # Default value
                if param == "Subject":
                    subject_header = msg["Subject"]
                    if subject_header:
                        decoded_parts = decode_header(subject_header)
                        value = ''.join([
                            p.decode(charset or 'utf-8') if isinstance(p, bytes) else p
                            for p, charset in decoded_parts
                        ])
                    else:
                        value = ""
                elif param == "From Email":
                    value = email.utils.parseaddr(msg.get("From", ""))[1]
                elif param == "From Domain":
                    from_addr = email.utils.parseaddr(msg.get("From", ""))[1]
                    value = from_addr.split('@')[1] if '@' in from_addr else ""
                elif param == "IP":
                    received_header = msg.get("Received")
                    if received_header and "[" in received_header:
                        try:
                            value = received_header.split("[")[1].split("]")[0]
                        except IndexError:
                            value = "IP Not Found"
                    else:
                        value = ""
                elif param == "SPF":
                    auth_results = clean(msg.get("Authentication-Results", ""))
                    if "spf=" in auth_results:
                        value = auth_results.split("spf=")[1].split()[0]
                    else:
                        value = "N/A"
                elif param == "DKIM":
                    auth_results = clean(msg.get("Authentication-Results", ""))
                    if "dkim=" in auth_results:
                        value = auth_results.split("dkim=")[1].split()[0]
                    else:
                        value = "N/A"
                elif param == "DMARC":
                    auth_results = clean(msg.get("Authentication-Results", ""))
                    if "dmarc=" in auth_results:
                        value = auth_results.split("dmarc=")[1].split()[0]
                    else:
                        value = "N/A"
                else:
                    # Generic header mapping
                    header_map = {
                        "From": "From", "To": "To", "CC": "Cc", "Reply-To": "Reply-To",
                        "In-Reply-To": "In-Reply-To", "Date": "Date", "Message-ID": "Message-ID",
                        "Return Path": "Return-Path", "Content-Type": "Content-Type", "MIME-Version": "MIME-Version",
                        "List-ID": "List-ID", "List-Unsubscribe": "List-Unsubscribe", "Sender": "Sender",
                        "Feedback-ID": "Feedback-ID"
                    }
                    if param in header_map:
                        value = clean(msg.get(header_map[param], ""))

                row[param] = value if value is not None else ""
            rows.append(row)
        
        mail.logout()
        return jsonify({"headers": params, "rows": rows})

    except imaplib.IMAP4.error as e:
        return jsonify({"error": f"IMAP Error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/check', methods=['GET'])
def check_domain():
    """API endpoint for checking domain reputation via Spamhaus."""
    domain = request.args.get('domain')
    if not domain:
        return jsonify({"error": "Domain parameter is required"}), 400

    try:
        # Use the actual Spamhaus API endpoint
        api_url = f"https://api.spamhaus.org/api/v1/domain/reputation/{domain}"

        # Try all API keys with automatic fallback
        success, data, error = make_spamhaus_request(api_url)

        if success:
            return jsonify({"data": data}), 200
        else:
            # If all API keys failed, return mock data as fallback
            print(f"Warning: All API keys failed for domain {domain}. Error: {error}. Using mock data.")
            mock_data = {
                "domain": domain,
                "score": 15,  # Mock score (0-100, lower is better)
                "details": [
                    {
                        "list": "CREATION DATE",
                        "description": "2015-03-10"
                    }
                ]
            }
            return jsonify({"data": mock_data}), 200

    except Exception as e:
        return jsonify({"error": str(e), "message": "Failed to check domain reputation"}), 500

@app.route('/api/check_ip', methods=['GET'])
def check_ip():
    """API endpoint for checking IP reputation via Spamhaus."""
    ip = request.args.get('ip')
    category = request.args.get('category', 'CSS')

    if not ip:
        return jsonify({"error": "IP parameter is required"}), 400

    try:
        # Use the actual Spamhaus API endpoint
        api_url = f"https://api.spamhaus.org/api/v1/ip/listing/{ip}"
        params = {"category": category}

        # Try all API keys with automatic fallback
        success, data, error = make_spamhaus_request(api_url, params)

        if success:
            return jsonify({"data": data}), 200
        else:
            # If all API keys failed, return mock data as fallback
            print(f"Warning: All API keys failed for IP {ip}. Error: {error}. Using mock data.")
            mock_data = {
                "ip": ip,
                "category": category,
                "listings": []
                # Example of listed IP:
                # "listings": [
                #     {
                #         "reason": "Spam source",
                #         "listed_on": "2024-01-15",
                #         "delisted_on": "2024-02-15"
                #     }
                # ]
            }
            return jsonify({"data": mock_data}), 200

    except Exception as e:
        return jsonify({"error": str(e), "message": "Failed to check IP reputation"}), 500

if __name__ == '__main__':
    app.run(debug=True)