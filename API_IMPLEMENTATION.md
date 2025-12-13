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

 

 

 
