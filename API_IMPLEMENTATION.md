
{"error": "can't adapt type 'dict'"}

{"table_name":"hil_loss_extraction_bkp12_23_25","data":{"id":null,"document_id":"13380539","document_name":"13380539_COMBINED.pdf","claim_no":null,"claim_no_confidence":null,"claim_no_page_no":null,"type":null,"type_confidence":null,"type_page_no":null,"carrier_name":null,"carrier_name_confidence":null,"carrier_name_page_no":null,"state":null,"state_confidence":null,"state_page_no":null,"claimant_name":null,"claimant_name_confidence":null,"claimant_name_page_no":null,"facility":null,"facility_confidence":null,"facility_page_no":null,"status":null,"status_confidence":null,"status_page_no":null,"loss_date":null,"loss_date_confidence":null,"loss_date_page_no":null,"report_date":null,"report_date_confidence":null,"report_date_page_no":null,"evaluation_date":null,"evaluation_date_confidence":null,"evaluation_date_page_no":null,"close_date":null,"close_date_confidence":null,"close_date_page_no":null,"loss_paid":null,"loss_paid_confidence":null,"loss_paid_page_no":null,"loss_reserve":null,"loss_reserve_confidence":null,"loss_reserve_page_no":null,"alae_paid":null,"alae_paid_confidence":null,"alae_paid_page_no":null,"alae_reserve":null,"alae_reserve_confidence":null,"alae_reserve_page_no":null,"loss_comments":null,"loss_comments_confidence":null,"loss_comments_page_no":null,"document_s3_uri":"s3://mpg-dev1-ai-input-file-extractor-bucket/13380539_COMBINED.pdf","policy_number":"6634","effective_date":"2020-01-01","first_named_insured":"TUTERA HEALTHCARE                                                                                   ","description":"SUBMISSION                                                                                                                                                                                                                                                ","supplemental_description":"INITIAL REQUEST                                                                                                                                                                                                                                           ","doc_handle":"13380539","doc_type_name":"Indication/Quote                                                  ","create_date_time":"2025-12-22 07:49:46.901811","processed_flag":0,"reviewer_status":"Approved","qc_status":null,"qc_comments":null,"reviewer_comments":null,"claim_no_correction":null,"type_correction":null,"carrier_name_correction":null,"state_correction":null,"claimant_name_correction":null,"facility_correction":null,"status_correction":null,"loss_date_correction":null,"report_date_correction":null,"evaluation_date_correction":null,"close_date_correction":null,"loss_paid_correction":null,"loss_reserve_correction":null,"alae_paid_correction":null,"alae_reserve_correction":null,"loss_comments_correction":null}}






=========================

Please find the API to add/delete a dataset, 3 testing tables are in place so that we don’t insert junk data into actual tables. Please utilize the same for testing purposes

 

subdata.hil_loss_extraction_bkp12_23_25
subdata.hil_account_extraction_bkp12_23_25
subdata.hil_exposure_extraction_bkp12_23_25
 

Lets discuss once you log in

 



API

1

Request Type

DELETE

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/reviewer-add-delete-dataset

Request Body

{

 "table_name": "hil_loss_extraction",

 "id": 740

}

API

Request Type

POST

 

API Url

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/reviewer-add-delete-dataset

 

Request Body

{

 "table_name": "hil_loss_extraction_bkp12_23_25",

    "document_id" : "13573860",

    "document_name" : "13573860_COMBINED.pdf",

    "claim_no" : "10999",  

    "claim_no_confidence" : "1",

    "claim_no_page_no" : "34",

    "document_s3_uri" : "s3://mpg-dev1-ai-input-file-extractor-bucket/13573860_COMBINED.pdf",

    "policy_number" : "896",

    "effective_date" : "2020-01-01",

    "first_named_insured" : "FRIENDS ASSOCIATION OF SERVICES FOR THE ELDERLY",

    "description" : "SUBMISSION",

    "supplemental_description" : "INITIAL REQUEST",

    "doc_handle" : "13573860",

    "doc_type_name" : "Indication/Quote",

    "create_date_time" : "2025-12-22 07:54:15.221487",

    "processed_flag" : "0",

    "reviewer_status" :"Approved"

}



















==========================================================================================

document_s3_uri text NULL,
	policy_number text NULL,
	effective_date text NULL,
	first_named_insured text NULL,
	description text NULL,
	supplemental_description text NULL,
	doc_handle text NULL,
	doc_type_name text NULL,
	extraction_type text NULL,
	create_date_time text NULL,
	processed_flag int2 DEFAULT 0 NULL,







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

 

 

 

 
