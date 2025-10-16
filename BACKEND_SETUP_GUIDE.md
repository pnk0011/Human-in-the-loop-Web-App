GetAllDocuments (Admin) 

Request Type 

GET 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-documents?page=1&limit=10&file_name=13455912_03-msg-Sum - GLPL - PDFwRuns - 07-22-2019-pdf03.txt&doc_type_name=All&priority=All&status=All 

Request Body 

 

Response Body 

{ 

    "status": "success", 

    "message": "Document list retrieved successfully", 

    "pagination": { 

        "page": 1, 

        "limit": 10, 

        "total_records": 1, 

        "total_pages": 1 

    }, 

    "documents": [ 

        { 

            "file_name": "13455912_03-msg-Sum - GLPL - PDFwRuns - 07-22-2019-pdf03.txt", 

            "doc_handle_id": "13455912", 

            "doc_type_name": null, 

            "distinct_entity_type_count": 1, 

            "avg_confidence_percentage": 94.0, 

            "priority": "High", 

            "latest_update_datetime": "1900-01-01 00:00:00", 

            "reviewer_assigned": null, 

            "qc_assigned": null, 

            "status": "0" 

        } 

    ] 

} 

Lambda Function 

mpg_uat_hil_get_all_documents (Python 3.12) 

 

Priority dropdownlist: Add a list with values 

 

All 

High 

Medium 

Low 

 

Note: High will be >= 80% | Medium >= 60 and <80 | Low < 60 

 
 
