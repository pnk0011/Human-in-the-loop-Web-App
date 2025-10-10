# Medical Insurance Web App - Backend API Specification

## Overview
This document outlines all the backend APIs required for the Medical Insurance Web App, including UI payloads and expected responses for each endpoint.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication APIs

### 1.1 Login
**Endpoint:** `POST /auth/login`

**UI Payload:**
```json
{
  "email": "admin@medpro.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "name": "Admin User",
      "email": "admin@medpro.com",
      "role": "Admin",
      "permissions": ["user.manage", "document.assign", "analytics.view", "document.validate", "document.qc", "history.view"],
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLogin": "2024-01-20T14:22:00Z",
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400
    }
  }
}
```

### 1.2 Logout
**Endpoint:** `POST /auth/logout`

**UI Payload:** None (uses Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 1.3 Validate Token
**Endpoint:** `GET /auth/validate`

**UI Payload:** None (uses Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "1",
      "name": "Admin User",
      "email": "admin@medpro.com",
      "role": "Admin",
      "permissions": ["user.manage", "document.assign", "analytics.view"],
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLogin": "2024-01-20T14:22:00Z",
      "isActive": true
    },
    "permissions": ["user.manage", "document.assign", "analytics.view"]
  }
}
```

---

## 2. Document Management APIs

### 2.1 Get Validation Queue (Reviewer Dashboard)
**Endpoint:** `GET /documents/validation-queue`

**UI Payload:** Query parameters
```
?page=1&limit=10&documentType=all&confidenceRange=all&priority=all&age=all&sortBy=document&sortOrder=asc
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "1",
        "documentName": "INV-2024-0947",
        "documentType": "Invoice",
        "field": "Total Amount Due",
        "confidence": 67,
        "priority": "High",
        "age": "2d min",
        "assignedTo": "You",
        "fieldsCount": 5,
        "status": "New",
        "extractedValue": "$12,847.50",
        "fieldDescription": "The total amount to be paid for this invoice",
        "expectedFormat": "$X,XXX.XX",
        "createdAt": "2024-01-18T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    },
    "stats": {
      "totalQueue": 47,
      "assignedToMe": 12,
      "highPriority": 8,
      "lowConfidence": 15
    }
  }
}
```

### 2.2 Get Document Details for Validation
**Endpoint:** `GET /documents/:id/validation`

**UI Payload:** None (document ID in URL)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "1",
      "documentName": "INV-2024-0947",
      "documentType": "Invoice",
      "priority": "High",
      "fields": [
        {
          "id": "field-1",
          "fieldName": "Total Amount Due",
          "fieldDescription": "The total amount to be paid for this invoice",
          "extractedValue": "$12,847.50",
          "confidence": 67,
          "expectedFormat": "$X,XXX.XX",
          "location": {
            "x": 48,
            "y": 415,
            "width": 220,
            "height": 28
          }
        }
      ],
      "documentImage": "base64_encoded_image_or_url",
      "createdAt": "2024-01-18T10:30:00Z",
      "assignedTo": "reviewer@medpro.com"
    }
  }
}
```

### 2.3 Submit Document Validation
**Endpoint:** `POST /documents/:id/validate`

**UI Payload:**
```json
{
  "validations": [
    {
      "fieldId": "field-1",
      "action": "accept",
      "correctedValue": null,
      "note": null,
      "rejectReason": null
    },
    {
      "fieldId": "field-2",
      "action": "correct",
      "correctedValue": "$12,850.00",
      "note": "Small discrepancy found in total calculation",
      "rejectReason": null
    },
    {
      "fieldId": "field-3",
      "action": "reject",
      "correctedValue": null,
      "note": null,
      "rejectReason": "Invalid format"
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document validation submitted successfully",
  "data": {
    "documentId": "1",
    "validatedFields": 3,
    "acceptedFields": 1,
    "correctedFields": 1,
    "rejectedFields": 1,
    "nextDocument": {
      "id": "2",
      "documentName": "PO-2024-3921"
    }
  }
}
```

### 2.4 Get Work History (Reviewer)
**Endpoint:** `GET /documents/work-history`

**UI Payload:** Query parameters
```
?page=1&limit=10&search=&typeFilter=all&dateFilter=all
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "1",
        "documentName": "DOC-2024-0001",
        "documentType": "Invoice",
        "completedDate": "2024-01-20T14:30:00Z",
        "fieldsCount": 5,
        "acceptedCount": 3,
        "correctedCount": 1,
        "rejectedCount": 1,
        "accuracy": 80
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    },
    "stats": {
      "totalCompleted": 48,
      "thisWeek": 12,
      "avgAccuracy": 87,
      "totalFields": 240
    }
  }
}
```

---

## 3. QC Management APIs

### 3.1 Get QC Queue
**Endpoint:** `GET /qc/queue`

**UI Payload:** Query parameters
```
?page=1&limit=10&documentType=all&reviewer=all&priority=all&status=all
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "1",
        "documentName": "INV-2024-0947",
        "documentType": "Invoice",
        "reviewer": "Jane Smith",
        "reviewedDate": "2024-01-20T10:30:00Z",
        "priority": "High",
        "status": "Pending QC",
        "fieldsCount": 5,
        "confidence": 67,
        "reviewerValidations": [
          {
            "fieldId": "field-1",
            "action": "correct",
            "correctedValue": "$12,850.00",
            "note": "Small discrepancy found"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    },
    "stats": {
      "totalQueue": 25,
      "pendingQC": 15,
      "highPriority": 8,
      "avgConfidence": 72
    }
  }
}
```

### 3.2 Get QC Document Details
**Endpoint:** `GET /qc/documents/:id`

**UI Payload:** None (document ID in URL)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "1",
      "documentName": "INV-2024-0947",
      "documentType": "Invoice",
      "priority": "High",
      "reviewer": "Jane Smith",
      "reviewedDate": "2024-01-20T10:30:00Z",
      "fields": [
        {
          "id": "field-1",
          "fieldName": "Total Amount Due",
          "extractedValue": "$12,847.50",
          "confidence": 67,
          "reviewerValidation": {
            "action": "correct",
            "correctedValue": "$12,850.00",
            "note": "Small discrepancy found"
          }
        }
      ],
      "documentImage": "base64_encoded_image_or_url"
    }
  }
}
```

### 3.3 Submit QC Review
**Endpoint:** `POST /qc/documents/:id/review`

**UI Payload:**
```json
{
  "decisions": [
    {
      "fieldId": "field-1",
      "decision": "approve",
      "qcNote": "Reviewer correction is accurate"
    },
    {
      "fieldId": "field-2",
      "decision": "sendback",
      "qcNote": "Please verify the corrected value"
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "QC review submitted successfully",
  "data": {
    "documentId": "1",
    "approvedFields": 1,
    "sentBackFields": 1,
    "nextDocument": {
      "id": "2",
      "documentName": "PO-2024-3921"
    }
  }
}
```

### 3.4 Get QC Work History
**Endpoint:** `GET /qc/work-history`

**UI Payload:** Query parameters
```
?page=1&limit=10&search=&typeFilter=all&reviewerFilter=all&dateFilter=all
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "1",
        "documentName": "DOC-2024-0001",
        "documentType": "Invoice",
        "reviewer": "Jane Smith",
        "completedDate": "2024-01-20T16:30:00Z",
        "reviewedDate": "2024-01-20T14:30:00Z",
        "fieldsCount": 5,
        "approvedCount": 4,
        "sentBackCount": 1,
        "passRate": 80
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 42,
      "itemsPerPage": 10
    },
    "stats": {
      "totalReviewed": 42,
      "thisWeek": 8,
      "avgPassRate": 85,
      "totalFields": 210
    }
  }
}
```

---

## 4. Admin Management APIs

### 4.1 Get All Users
**Endpoint:** `GET /admin/users`

**UI Payload:** Query parameters
```
?page=1&limit=10&search=&roleFilter=all&statusFilter=all
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "1",
        "name": "Admin User",
        "email": "admin@medpro.com",
        "role": "Admin",
        "status": "Active",
        "currentLoad": 0,
        "totalValidated": 0,
        "accuracy": 0,
        "createdDate": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalItems": 32,
      "itemsPerPage": 10
    },
    "stats": {
      "totalUsers": 32,
      "activeUsers": 28,
      "reviewers": 20,
      "qcSpecialists": 8
    }
  }
}
```

### 4.2 Create User
**Endpoint:** `POST /admin/users`

**UI Payload:**
```json
{
  "name": "John Doe",
  "email": "john.doe@medpro.com",
  "role": "Reviewer",
  "status": "Active",
  "assignedQC": "qc@medpro.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "33",
      "name": "John Doe",
      "email": "john.doe@medpro.com",
      "role": "Reviewer",
      "status": "Active",
      "currentLoad": 0,
      "totalValidated": 0,
      "accuracy": 0,
      "createdDate": "2024-01-20T16:30:00Z"
    }
  }
}
```

### 4.3 Update User
**Endpoint:** `PUT /admin/users/:id`

**UI Payload:**
```json
{
  "name": "John Doe Updated",
  "email": "john.doe.updated@medpro.com",
  "role": "Reviewer",
  "status": "Active"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "33",
      "name": "John Doe Updated",
      "email": "john.doe.updated@medpro.com",
      "role": "Reviewer",
      "status": "Active",
      "currentLoad": 0,
      "totalValidated": 0,
      "accuracy": 0,
      "createdDate": "2024-01-20T16:30:00Z"
    }
  }
}
```

### 4.4 Delete User
**Endpoint:** `DELETE /admin/users/:id`

**UI Payload:** None (user ID in URL)

**Expected Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 4.5 Get Document Assignment Queue
**Endpoint:** `GET /admin/documents/assignment`

**UI Payload:** Query parameters
```
?page=1&limit=10&statusFilter=all&typeFilter=all&priorityFilter=all&search=
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "1",
        "documentName": "INV-2024-0947",
        "documentType": "Invoice",
        "fieldsCount": 5,
        "confidence": 67,
        "priority": "High",
        "uploadDate": "2024-01-20T10:30:00Z",
        "status": "Unassigned",
        "assignedTo": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10
    },
    "stats": {
      "totalDocuments": 47,
      "unassigned": 25,
      "assigned": 15,
      "inProgress": 7
    }
  }
}
```

### 4.6 Assign Documents to Reviewer
**Endpoint:** `POST /admin/documents/assign`

**UI Payload:**
```json
{
  "documentIds": ["1", "2", "3"],
  "assignedTo": "reviewer@medpro.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "3 document(s) assigned to reviewer@medpro.com",
  "data": {
    "assignedCount": 3,
    "assignedTo": "reviewer@medpro.com"
  }
}
```

### 4.7 Get Analytics Data
**Endpoint:** `GET /admin/analytics`

**UI Payload:** Query parameters
```
?period=week&startDate=2024-01-01&endDate=2024-01-31
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDocumentsProcessed": 1247,
      "activeReviewers": 12,
      "avgProcessingTime": 8.5,
      "accuracyRate": 94.2
    },
    "reviewerPerformance": [
      {
        "name": "John Doe",
        "completed": 127,
        "accuracy": 94,
        "avgTime": 8.5
      }
    ],
    "documentTypeDistribution": [
      {
        "name": "Medicare Claim",
        "value": 342,
        "color": "#0292DC"
      }
    ],
    "priorityDistribution": [
      {
        "priority": "High",
        "count": 89,
        "color": "#FF0081"
      }
    ],
    "statusSummary": {
      "approved": 856,
      "pendingReview": 301,
      "sentBack": 90
    }
  }
}
```

---

## 5. Dashboard Stats APIs

### 5.1 Get Dashboard Stats (Reviewer)
**Endpoint:** `GET /dashboard/reviewer/stats`

**UI Payload:** None (uses Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "queueCount": 24,
    "completedToday": 8,
    "avgAccuracy": 92,
    "avgProcessingTime": 7.5
  }
}
```

### 5.2 Get Dashboard Stats (QC)
**Endpoint:** `GET /dashboard/qc/stats`

**UI Payload:** None (uses Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "queueCount": 5,
    "reviewedToday": 12,
    "avgPassRate": 88,
    "avgReviewTime": 6.2
  }
}
```

### 5.3 Get Dashboard Stats (Admin)
**Endpoint:** `GET /dashboard/admin/stats`

**UI Payload:** None (uses Authorization header)

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 1247,
    "activeUsers": 28,
    "pendingAssignments": 25,
    "systemHealth": 98.5
  }
}
```

---

## 6. Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes:
- `VALIDATION_ERROR` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `INTERNAL_ERROR` - Server error

---

## 7. Pagination

All list endpoints support pagination with these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Pagination response format:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 8. Filtering and Sorting

Most list endpoints support filtering and sorting:

### Common Filter Parameters:
- `search` - Text search across relevant fields
- `status` - Filter by status
- `type` - Filter by document type
- `priority` - Filter by priority
- `dateFrom` / `dateTo` - Date range filter

### Common Sort Parameters:
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

---

## 9. File Upload APIs

### 9.1 Upload Document
**Endpoint:** `POST /documents/upload`

**UI Payload:** Multipart form data
```
file: <binary_file>
documentType: "Invoice"
priority: "High"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentId": "123",
    "documentName": "INV-2024-0947",
    "status": "Processing",
    "estimatedProcessingTime": "2-3 minutes"
  }
}
```

---

## 10. Real-time Updates

### 10.1 WebSocket Connection
**Endpoint:** `WS /ws`

**Connection:** After authentication, connect to WebSocket for real-time updates

**Message Types:**
```json
{
  "type": "document_assigned",
  "data": {
    "documentId": "123",
    "assignedTo": "reviewer@medpro.com"
  }
}
```

```json
{
  "type": "validation_completed",
  "data": {
    "documentId": "123",
    "reviewer": "reviewer@medpro.com",
    "status": "completed"
  }
}
```

---

This API specification covers all the functionality needed for the Medical Insurance Web App. Each endpoint is designed to support the UI components and user workflows identified in the application.
