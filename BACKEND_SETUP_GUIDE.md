Get All QC Documents 

 

Request Type 

GET 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-qc-documents?quality_control=Test@medpro.com&page=1&limit=25&doc_type_name=All&priority=All&status=All&reviewer=Review@medpro.com 

Request Body 

 

Response 

{ 

    "status": "success", 

    "message": "QC Document list retrieved successfully", 

    "pagination": { 

        "page": 1, 

        "limit": 25, 

        "total_records": 0, 

        "total_pages": 0 

    }, 

    "documents": [] 

} 

 

Lambda Function 

mpg_uat_hil_get_all_qc_documents (Python 3.12) 

 

 

 

 

 

View file (QC) 

 

Request Type 

POST 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/qc-open-file 

Request Body 

{ 

  "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt" 

} 

Response 

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

                    "confidence": 98.0, 

                    "updated_entity_text": null, 

                    "reviewer_action": "accept", 

                    "reviewer_comment": null 

                }, 

                { 

                    "entity_type": "POLICY NUMBER", 

                    "entity_value": "12,850.00", 

                    "confidence": 99.0, 

                    "updated_entity_text": "12,850.00", 

                    "reviewer_action": "correct", 

                    "reviewer_comment": "Small discrepancy found in total calculation" 

                } 

            ], 

            "documentImage": "https://mpg-qa-ai-rds-raw-data-bucket.s3.amazonaws.com/13455912.msg/13455912_02-msg-ACORD%20125%20application-pdf02.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAY5X6XOLHI3GTZJJ6%2F20251021%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20251021T122251Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFwaCXVzLWVhc3QtMiJGMEQCIHhfBB207Uf4OlNesoRi44HMmxKpzi0UC44VjSwWw%2FGoAiB0Pb4zfbdPXymi0xSUK8L5r6SUvrI30vfV8hgWs6kJXyqEAwgWEAUaDDYxMzY0MDc5NDgzMCIM21aRSMVnf5tNUOPPKuEC%2FrpMn%2F6qMJ0Wc0Tn1Ed76a12rcLRmW8wgcVFjw8Ie0gSBt3CrSoMBffLGtFr1ZsWaTKb0%2BiaVyTMsjqoGZU5BsWkNY8NjozPZLH1xdVnz9G0HkYFrnMv9%2B%2BxaUcQRwu%2FCJjYqb3kjKkchXfrPUbRHsyVhBs74cuGKnm4NCV3tMFrn6zHVQIVjMiaTysUhJq1Q%2BfzIDvckXdDzmsxhcw1MNHLAZjVF%2FvJFmig48%2Bt1wQnBBYurgW%2BSXh0KEL1toHnC9EUmCSuwP6oAcnGDiUFQKapIhOFWeu7O1bM84uN4duQeCSdFZwiVz7vCm7jle30otBiZZaoUw58JnfyMeckeWgK83oaiFcQoICD%2BrDWusuOE1xq2uyrM%2BLuDIfEfTtKuupb4xQnpR%2BKSwflSNiCLjKZlozaArr5kbI4beKIAftwKz71Sq%2FnkpmfsNYRnKEjVnzee64h%2Bb%2BIYBxGcOGVoawwlvbdxwY6nwEZCW90uB3WgBuLPOOBiJDarX%2BCHAVLQ3bS4ozxf7i%2FuVow3RjqAAUVkuGi9MNPK7MTBylNepKfoA8rz9IscONeWOpakDveLKhdd9PtB5VHwF4gkzMV707L2Prq%2BICnJqzSaeoBizU4zDAArPCU1V5U6%2BJbvO0GJbV9TXPRFk4SpbYNve5Lr4l5k5emDLvOIcQxeuBT6oc2EH8YkNURH3g%3D&X-Amz-Signature=5080812f0ec1a34557716cc25e4388336a014d7d0628d2ac0c3c25707c941cf1", 

            "qc_updated_dt": "2025-10-17 14:06:38.682400", 

            "reviewer": "Review@medpro.com                                                                                   " 

        } 

    } 

} 

 

Lambda Function 

mpg_uat_hil_qc_open_file (Python 3.12) 

 

 

 

 

Update File (QC) 

 

Request Type 

PUT 

URL 

https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/update-file-qc 

Request Body 

{ 

    "file_name": "13455912_02-msg-ACORD 125 application-pdf02.txt", 

    "validations": [ 

        { 

            "entity_type": "FILE MANAGER", 

            "qc_action": "approve", 

            "qc_comment": null 

        }, 

        { 

            "entity_type": "POLICY NUMBER", 

            "qc_action": "reject", 

            "qc_comment": "Date format is incorrect, needs human review." 

        } 

    ] 

} 

 

Response 

{ 

    "message": "Successfully processed 2 entities for file '13455912_02-msg-ACORD 125 application-pdf02.txt'. Final status set to '2'.", 

    "total_rows_updated": 2 

} 

 

Lambda Function 

mpg_uat_hil_qc_update_open_file (Python 3.12) 

