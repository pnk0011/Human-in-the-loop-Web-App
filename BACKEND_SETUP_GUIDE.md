USER REGISTRATION API 

Request Type 

POST 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/register 

Request Body 

{ 

  "firstName": "Binoj", 

  "lastName": "Cherian", 

  "email": "Binoj20.Cherian@example.com", 

  "role": "Reviewer", 

  "password": "securepassword123", 

  "qualityControl":"example@example.com" 

} 

 

Response 

Status Code: 201  | Created | (Successful Registration) 

Status Code: 409  | Conflict | User with the email already exists 

Status Code: 500  | Conflict | A critical error occurred (Database or Secret Manager | Internal server error during registration) 

 

Lambda Function 

mpg_uat_hil_user_registration  (Python 3.12) 

IAM Role 

medpro-dev-ds-generic-lambda-role 

Aurora Table 

Snrcaredb.subdata.hil_users (pk: email) 

VPC 

vpc-0b37fec526916ca52 

 

Note 

Password encrypted/encode decryption pending 

Email module pending 

 

LOGIN 

Request Type 

POST 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/login 

Request Body 

{ 

  "email": "Test@example.com", 

  "password": "securepassword123" 

} 

 

Response Body 

{ 

    "status": "success", 

    "message": "Login successful", 

    "user": { 

        "firstName": "Surya", 

        "lastName": "Jacob", 

        "email": "Binoj.Jacob@example.com", 

        "role": "Reviewer", 

        "isActive": true, 

        "created_time": "2025-10-13 09:44:21.089183+00:00", 

        "last_login": "2025-10-13 10:47:58.851282+00:00", 

        "qualityControl": null 

    } 

} 

 

Lambda Function 

mpg_uat_hil_user_login (Python 3.12) 

 

 

 

Get User List 

Request Type 

GET 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-users?page=1&limit=5&search=Binoj&rolefilter=Reviewer&statusfilter=active 

Response Body 

{ 

     "status": "success", 

    "message": "User list retrieved successfully", 

    "pagination": { 

        "page": 1, 

        "limit": 10, 

        "total_records": 14, 

        "total_pages": 2 

    }, 

    "users": [ 

        { 

            "email": "Binoj1.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:18:43.976536+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj2.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:18:51.393905+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj3.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:18:59.393920+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj4.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:07.253866+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj5.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:14.753892+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj6.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:23.416150+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj7.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:31.853832+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj8.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:41.795944+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj9.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:51.776424+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        }, 

        { 

            "email": "Binoj10.Cherian@example.com", 

            "first_name": "Binoj", 

            "last_name": "Cherian", 

            "role": "Reviewer", 

            "created_time": "2025-10-13 08:19:57.653812+00:00", 

            "last_login": null, 

            "isactive": true, 

            "quality_control": null 

        } 

    ] 

} 

 

Lambda Function 

mpg_uat_hil_get_all_users (Python 3.12) 

Update User 

Request Type 

PUT 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/update-user 

Request Body 

{ 

  "email": "Binoj1.Cherian@example.com", 

  "firstName": "Surya Michael", 

  "lastName": "Jacobson", 

  "role": "QA-Tester", 

  "isactive": false  

} 

 

Response Body 

{ 

    "status": "success", 

    "message": "User updated successfully", 

    "Email": "Binoj10.Cherian@example.com", 

    "updates": { 

        "firstName": "Surya Michael", 

        "lastName": "Jacobson", 

        "role": "QA-Tester", 

        "isactive": false 

    } 

} 

 

Lambda Function 

mpg_uat_hil_update_user (Python 3.12) 

 

 

Delete User 

Request Type 

DELETE 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/delete-user 

Request Body 

{ 

  "email": "Binoj.Cherian@example.com" 

} 

Response Body 

{ 

    "status": "success", 

    "message": "User deleted successfully", 

    "deleted_email": "Binoj2.Cherian@example.com", 

} 

 

Lambda Function 

mpg_uat_hil_delete_user (Python 3.12) 

 
