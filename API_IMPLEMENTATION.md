	Remove all the console.log (User passwords are also getting displayed in console)			
1	Add DocumentID column 		UI	
2	"Add DocumentId filter
https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-unique-document-id"		UI	
3	Rename existing 'Document' column to 'Filename' 		UI	
4	Add new stats to get 'Total Documents'		UI	
5	Rename existing 'Total Documents' to 'Total Files'		UI	
6	Filter have headings in reviewer page but are missing in Admin page 		UI	
7	"Update the layout to utilize 100% width of the page instead 1400(maxwidth)




"			
8	Remove 'Forgot Password' link in login page		UI	
9	Admin Grid load response for records modified from 'document' to 'files'		UI	
10	"Update the 'User Management' page with 'Stats' from API
"		UI	
11	Load document filter with actual values as shared over Email		UI	
12	Add an additional 'download' button to download the document in case viewer is unable to open the file		UI	
				
REVIEWER				
1	Remove 'Export List' if not working		UI	
2	"Add DocumentId filter
https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-unique-document-id?reviewer=binoj.Cherian@genpact.com"		UI	
3	Rename 'Assigned Documents' to 'Assigned Files'		UI	
4	Remove 'Avg. Completion Time' stat		UI	
5	Status' | 'priority' chip color change similar to Admin page		UI	
6	Rename 'Document' column to 'Filename'		UI	
7	Include 'DocumentID' column		UI	
8	Add a additional filter to filter based on documentid (default to All if no specific document selected)		UI	
9	On Reassigned from QA display the display updated value field along with actual value		UI	
QUALITY CONTROL				
1	Remove 'Export List' button		UI	
2	Change 'Document' to filename in grid		UI	
3	Load 'Document Type' filter		UI	
4	"Load 'Reviewer' assigned from API
https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-reviewer-assignedto-qc?qc_user=qc@medpro.com"		UI	
5	"Add DocumentId filter
https://vl6dkatfng.execute-api.us-east-2.amazonaws.com/uat/get-all-unique-document-id?quality_control=qc@medpro.com"		UI	
