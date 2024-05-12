## Serverless REST Assignment.

__Name:__ Seamus McCarthy

This repository contains an implementation of a serverless REST API for the AWS platform. The CDK framework is used to provision its infrastructure. The API's domain context is movie reviews.
Since Assignment 1, the project has been expanded playlist management and persistence to DynamoDB. Cloudfront deployment has also been added.

### (New) API endpoints.
 
+ POST /users/{username}/playlists - add a playlist
+ GET /users/{username}/playlists - get all of this user's playlists
+ DELETE /users/{username}/playlists/{playlistname} - Delete a user's playlist
+ POST /playlists/{playlistname}/entries - add a playlist entry
+ GET /playlists/{playlistname}/entries - get all entries on a playlist
+ DELETE /playlists/{playlistname}/entries/{movieid} - Delete an entry from a user's playlist

### Authentication.

Authentication is still catered for via Sign-up, Confirm Sign-up, Login and Logout lambda functions.

### Cloudfront deployment

Deployment has been expanded to also deploy the frontend to Cloudfront. The Dist contents were copied into the repo and deployed to an S3 bucket.
An Origin Access Identity was created and granted read access to the bucket. The bucket also contains a dynamically created file containing the
URLs of the App and Auth APIs for use by the frontend code.

### Issues

Did encounter an issue around the deployment which appears to be somewhat flaky. Initially, I was receiving a blank page with no error code. After re-introducing the websiteIndexDocument and websiteErrorDocument on the S3 bucket, this changed to a 403 error complaining about a failure to retrieve a Customer Error Document. After changing the bucket creation to use 'index.html' for websiteErrorDocument rather than 'error/index.html' and re-deploying, the distribution domain name started working. While testing the deployed version, trying to login highlighted an error in the frontend code's attempts to use the dynamic API URLs. After correcting this error and re-deploying, the domain name was again returning a 403. 
