Recommended Users Function

Purpose: Return a JSON list of Appwrite users whose email ends with '@college.edu' for the Connect tab recommendations.

Environment variables required (provided by Appwrite Function runtime or set manually for local testing):
- APPWRITE_ENDPOINT
- APPWRITE_PROJECT_ID
- APPWRITE_API_KEY

Behavior:
- Connects to Appwrite using the Server SDK
- Lists all users with pagination (100 per page)
- Filters to emails ending in '@college.edu'
- Returns the filtered array as JSON

Response shape:
- 200: Array of Appwrite User objects
- 500: { error: string }

