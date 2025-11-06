Use this API to show (reviewer) list
 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-reviewer-assignedto-qc?qc_user=All

 

Reviewer file (added qc_action in response so that you can hide records based on it)
 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/review-open-file

 

Sendback logic has been updated.
 

Add a new header in all the API calls for security
 

'x-api-key': 'jLGO7tJFHxB0bVc0UmGe6Esns9pkiJR8V3lV8qJ5'

 

In each lambda function (load the x-api-key from .env file as we might be rotating it once a while)
