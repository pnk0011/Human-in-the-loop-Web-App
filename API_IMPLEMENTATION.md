{"table_name":"subdata.hil_account_extraction","action":"Approved","id":51,"data":{"corrected_value":"50","original_value":"51","reviewer_comments":"done","page_no":null,"field_name":"id"}}


Request Type

PUT

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/reviewer-update-policy-documents

Request Body

 {

    "table_name": "subdata.hil_loss_extraction",

    "action": "Approved",

    "id": 106,

    "data": {

        "reviewer_comments": "Verified manually",

        "qc_comments": "Test"

    }

}

 

2

Request Type

PUT

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/qc-update-policy-documents

Request Body

{

    "table_name": "subdata.hil_loss_extraction",

    "action": "Approved",

    "id": 106,

    "data": {

        "reviewer_comments": "Verified manually",

        "qc_comments": "Not Correct"

    }

}





==========================================================================================================================
https://dtljpaytvdo6y.cloudfront.net/

Admin (GetAllDocuments)
 

 

URL

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-documents?page=1&limit=10&search_term=LLC&status=1

Sample response

{

    "status": "success",

    "message": "Database operations completed successfully. Active documents fetched.",

    "stats": {

        "Total_accounts": 54,

        "Assigned_accounts": 0,

        "Completed_accounts": 1

    },

    "pagination": {

        "page": 1,

        "limit": 10,

        "total_records": 1,

        "total_pages": 1

    },

    "files": [

        {

            "id": 6380,

            "first_named_insured": "RK4 LLC",

            "document_count": 8,

            "description_summary": "DECLINATION | SUBMISSION | SUPPORTING DOCUMENTATION",

            "reviewer_assigned": null,

            "qc_assigned": null,

            "status": "1",

            "is_active": true

        }

    ]

}

 

 

 

Assign Reviewers
 

URL

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/assign-reviewer

 

Sample Request

{

    "first_named_insured": [

        "BAYVILLE HEALTHCARE LLC",

        "RK4 LLC",

        "CPP SENIOR HOLDINGS, LLC",

        "DUPAGE COUNTY ILLINOIS CONVALESCENT CENTER"

    ],

    "reviewer_assigned": "Binoj.Cherian@medpro.com",

    "qc_assigned": "Pankaj.Singh@medpro.com",

    "status": "2"

}

 

 

 

Get Reviewer Documents
 



URL

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-reviewer-documents?reviewer_assigned=Binoj.Cherian@medpro.com&page=1&limit=25&status=2&first_named_insured=BAYVILLE

 

Sample Response

{

    "status": "success",

    "message": "Successfully assigned policies to reviewer",

    "stats": {

        "Assigned_accounts": 54,

        "Completed_accounts": 0

    },

    "pagination": {

        "page": 1,

        "limit": 25,

        "total_records": 1,

        "total_pages": 1

    },

    "files": [

        {

            "id": 863,

            "first_named_insured": "BAYVILLE HEALTHCARE LLC",

            "document_count": 8,

            "description_summary": "INFO GATHERING | MPG | RATING TOOL | SUBMISSION | SUPPORTING DOCUMENTATION",

            "reviewer_assigned": "Binoj.Cherian@medpro.com",

            "qc_assigned": "Pankaj.Singh@medpro.com",

            "status": "2",

            "is_active": true

        }

    ]

}



=====================================================================================================================
 New APIs

 1

 Request Type

GET

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/admin-get-unique-policies?page=1&limit=10&search_term=LLC&status=2

Request Body

 

 

2

Request Type

PUT

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/admin-assign-reviewer

Request Body

{
    "first_named_insured": [
        "ORION MANOR ALF LLC",
        "CORNERSTONE REALTY HOLDINGS LLC"
    ],
    "reviewer_assigned": Binoj.Cherian@medpro.com,
    "qc_assigned": Pankaj.Singh@medpro.com,
    "status": "2"
}

 

3

Request Type

GET

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/reviewer-get-assigned-policies?reviewer_assigned=Binoj.Cherian@medpro.com&page=1&limit=25&status=2

Request Body

 

 

4

Request Type

POST

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/reviewer-view-policy-documents

Request Body

{
  "first_named_insured": "ORION MANOR ALF LLC"
}

 

5

Request Type

GET

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/qc-get-assigned-policies?qc_assigned=Pankaj.Singh@medpro.com&page=1&limit=25&status=3

Request Body

 

 

6

Request Type

POST

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/qc-view-policy-documents

Request Body

{
  "first_named_insured": "CORNERSTONE REALTY HOLDINGS LLC"
}

 

 

 

 
