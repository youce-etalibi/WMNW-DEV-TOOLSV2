"""
Test script for Spamhaus API key rotation and fallback mechanism.
This script tests the API endpoints to ensure they work correctly.
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_domain_check():
    """Test domain reputation check endpoint."""
    print("\n" + "="*60)
    print("Testing Domain Reputation Check")
    print("="*60)

    test_domains = ["example.com", "google.com", "yahoo.com"]

    for domain in test_domains:
        print(f"\nChecking domain: {domain}")
        try:
            response = requests.get(f"{BASE_URL}/api/check", params={"domain": domain})
            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Exception: {str(e)}")

def test_ip_check():
    """Test IP reputation check endpoint."""
    print("\n" + "="*60)
    print("Testing IP Reputation Check")
    print("="*60)

    test_ips = [
        ("8.8.8.8", "CSS"),
        ("1.1.1.1", "XBL"),
        ("208.67.222.222", "SBL")
    ]

    for ip, category in test_ips:
        print(f"\nChecking IP: {ip} (Category: {category})")
        try:
            response = requests.get(f"{BASE_URL}/api/check_ip", params={"ip": ip, "category": category})
            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Exception: {str(e)}")

def main():
    print("\n" + "#"*60)
    print("# Spamhaus API Key Rotation Test Suite")
    print("#"*60)
    print("\nMake sure Flask server is running on http://localhost:5000")
    print("Press Enter to continue or Ctrl+C to cancel...")
    try:
        input()
    except KeyboardInterrupt:
        print("\nTest cancelled.")
        return

    # Run tests
    test_domain_check()
    test_ip_check()

    print("\n" + "#"*60)
    print("# Test Suite Complete")
    print("#"*60)
    print("\nNOTE: If you see mock data, it means all API keys failed.")
    print("The system will automatically try all 5 API keys before falling back to mock data.")

if __name__ == "__main__":
    main()
