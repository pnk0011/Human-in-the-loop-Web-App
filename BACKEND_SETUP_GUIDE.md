Assign Reviewers (Admin) 

 

Request Type 

PUT 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/assign-reviewer 

Request Body 

{ 

    "file_names": [ 

        "13455912_02-MANT 125 request05.txt", 

        "13455912_02-msg-ACORD 125 application-pdf02.txt", 

        "13455912_03-msg-Sum - GLPL - PDFwRuns - 07-22-2019-pdf03.txt", 

        "13455912_02-WRANG 125 application-pdf08.txt" 

    ], 

    "reviewer": "Review@medpro.com", 

    "qc_assigned": "Test@medpro.com", 

    "status": "2" 

} 

 

Response Body 

{ 

    "message": "Successfully updated assignments for 4 file(s).", 

    "reviewer": "Review@medpro.com", 

    "qc_assigned": "Test@medpro.com", 

    "status": "2", 

    "total_entity_rows_updated": 6, 

    "updated_files_summary": [ 

        { 

            "file_name": "13455912_02-MANT 125 request05.txt", 

            "rows_updated": 2 

        }, 

        { 

            "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt", 

            "rows_updated": 2 

        }, 

        { 

            "file_name": "13455912_03-msg-Sum - GLPL - PDFwRuns - 07-22-2019-pdf03.txt", 

            "rows_updated": 1 

        }, 

        { 

            "file_name": "13455912_02-WRANG 125 application-pdf08.txt", 

            "rows_updated": 1 

        } 

    ] 

} 

 

Lambda Function 

mpg_uat_hil_update_user (Python 3.12) 

 

 

Reviewer DashBoard Grid) 

 

Request Type 

GET 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-reviewer-documents?reviewer=Review@medpro.com&page=1&limit=25&doc_type_name 

=All&priority=All&status=All 

Request Body 

 

Response Body 

{ 

    "status": "success", 

    "message": "Document list retrieved successfully", 

    "pagination": { 

        "page": 1, 

        "limit": 25, 

        "total_records": 4, 

        "total_pages": 1 

    }, 

    "documents": [ 

        { 

            "file_name": "13455912_02-MANT 125 request05.txt", 

            "doc_handle_id": "13455912", 

            "doc_type_name": null, 

            "distinct_entity_type_count": 2, 

            "avg_confidence_percentage": 99.0, 

            "priority": "High", 

            "reviewer_update_dt": "2025-10-17 14:06:38.682400", 

            "reviewer_assigned": "Review@medpro.com                                                                                   ", 

            "qc_assigned": "Test@medpro.com                                                                                     ", 

            "status": "2", 

            "age_assigned": "0d 0h" 

        }, 

        { 

            "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt", 

            "doc_handle_id": "13455912", 

            "doc_type_name": null, 

            "distinct_entity_type_count": 2, 

            "avg_confidence_percentage": 98.5, 

            "priority": "High", 

            "reviewer_update_dt": "2025-10-17 14:06:38.682400", 

            "reviewer_assigned": "Review@medpro.com                                                                                   ", 

            "qc_assigned": "Test@medpro.com                                                                                     ", 

            "status": "2", 

            "age_assigned": "0d 0h" 

        }, 

        { 

            "file_name": "13455912_02-WRANG 125 application-pdf08.txt", 

            "doc_handle_id": "13455912", 

            "doc_type_name": null, 

            "distinct_entity_type_count": 1, 

            "avg_confidence_percentage": 100.0, 

            "priority": "High", 

            "reviewer_update_dt": "2025-10-17 14:06:38.682400", 

            "reviewer_assigned": "Review@medpro.com                                                                                   ", 

            "qc_assigned": "Test@medpro.com                                                                                     ", 

            "status": "2", 

            "age_assigned": "0d 0h" 

        }, 

        { 

            "file_name": "13455912_03-msg-Sum - GLPL - PDFwRuns - 07-22-2019-pdf03.txt", 

            "doc_handle_id": "13455912", 

            "doc_type_name": null, 

            "distinct_entity_type_count": 1, 

            "avg_confidence_percentage": 94.0, 

            "priority": "High", 

            "reviewer_update_dt": "2025-10-17 14:06:38.682400", 

            "reviewer_assigned": "Review@medpro.com                                                                                   ", 

            "qc_assigned": "Test@medpro.com                                                                                     ", 

            "status": "2", 

            "age_assigned": "0d 0h" 

        } 

    ] 

} 

 

Lambda Function 

mpg_uat_hil_get_all_reviewer_documents (Python 3.12) 

 

View Each File (Reviewer) 

 

Request Type 

POST 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/review-open-file 

Request Body 

{ 

  "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt" 

} 

Response Body 

{ 

    "success": true, 

    "data": { 

        "document": { 

            "id": "13455912", 

            "documentName": "13455912_02-msg-ACORD 125 application-pdf02.txt", 

            "documentType": null, 

            "priority": "N/A", 

            "fields": [ 

                { 

                    "entity_type": "FILE MANAGER", 

                    "entity_value": "HPLG46852643002", 

                    "confidence": 98.0 

                }, 

                { 

                    "entity_type": "POLICY NUMBER", 

                    "entity_value": "12,850.00", 

                    "confidence": 99.0 

                } 

            ], 

            "documentImage": "https://mpg-qa-ai-rds-raw-data-bucket.s3.amazonaws.com/13455912.msg/13455912_02-msg-ACORD%20125%20application-pdf02.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAY5X6XOLHAJOWDT6W%2F20251017%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20251017T142231Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEP7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMiJGMEQCIBLAzXk0nIVcAY5lZplVXQh0aLcUB3hUREe%2FJa%2BR6%2ByZAiAftvSLiSAuolX0HcvgTUdlZiXiFe1YV0S1XWczG%2BtYFiqWAwio%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAUaDDYxMzY0MDc5NDgzMCIMWEsJmbDVKpf%2BYW8bKuoCKeDR41NJ%2BefvQonZy6EK0ZPIepMVFzmukW9r73vPoVGuaT76PKjafcTtgJxedXWS1UaGz8LXvkycvxvKarS%2FxtHQxpJ0H7t3%2Bg1%2BuuAoh2owcOdV7Zx1WQcYZW2j65Sa8Ggl%2BAZeHEjSCS4krUP4CxKqbFpCEDTYPRt9TeRPZHSLt5dyR4D0SyV02soIjP%2Ba9zBn2HEDsZ%2FO5ncdqE32qc8N%2FLgL1u4xSkn4d3hcrBYvHDITfP5d23%2BXiPlrfb2x0Ou6bjKoHLwbP39%2BFnNJ0jXQ1GhkxjpKv%2BBRo0%2Fc8IKDKzHL407jhN%2FQgrL4T4F6lBbej2EFc%2F78nGXA0gZynNEdsxfIYyjU3UlrLqdwaTyz2xb6ZhsOJOc0agmSXcttd2mamOAix%2BZj%2B4yScvUzps3m53mEYM7ARauffmrajSskTuvYfAJWPgu3KPy09bLu2Xg4kdXecH354%2BQk590lqB7MYNDn30dtpAYwoqLJxwY6ngH4xzMywSARlU1zZlHg2NdBT4xqSStKtwfHi6kp0b8ZYIyxwhP1UnJmj5c6CmqS2SQzS0qybfbPdgqOK%2Bsrb1ycz1YfCz3BdmJBTC9rjM7i51we50BaZ759JRrbOOn3RHHU7XqA%2FGJ7nH6zOiVaYREZC13nueUfHUZDfFMSH0wteDtOy3RmbHBdFmi%2F3vXi9aXkQU4mHPqyuft%2Bayz33A%3D%3D&X-Amz-Signature=e5b7ba8adc75a565bb6511fd38e454df5a95a675862879adfaae97a1a0808cc9", 

            "reviewer_updated_dt": "2025-10-17 14:06:38.682400", 

            "reviewer": "Review@medpro.com                                                                                   " 

        } 

    } 

} 

 

Lambda Function 

mpg_uat_hil_review_open_file (Python 3.12) 

 

 

Update File (Reviewer) 

 

Request Type 

PUT 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/update-file-reviewer 

Request Body 

{ 

  "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt", 

  "validations": [ 

    { 

      "entity_type": "FILE MANAGER", 

      "reviewer_action": "accept", 

      "updated_entity_text": null, 

      "reviewer_comment": null 

    }, 

    { 

      "entity_type": "POLICY NUMBER", 

      "reviewer_action": "correct", 

      "updated_entity_text": "12,850.00", 

      "reviewer_comment": "Small discrepancy found in total calculation" 

    } 

  ] 

} 

 

Response 

{ 

    "message": "Successfully processed 2 entities for file '13455912_02-msg-ACORD 125 application-pdf02.txt'.", 

    "total_rows_updated": 2 

} 

 

Lambda Function 

mpg_uat_hil_update_open_file  (Python 3.12) 

 
