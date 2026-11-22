# DMS serverless backend

This folder contains the AWS SAM template and Lambda API source for UniCloud DMS.

## Previously deployed environment

- Stack: `dms-dev`
- Region: `ap-southeast-1`
- API: API Gateway HTTP API `6wcs1urcm2`
- Lambda functions: `dms-dev-documents` and `dms-dev-health`
- Cognito User Pool: `ap-southeast-1_hWIAdC6Xu`
- DynamoDB tables: `dms-dev-documents`, `dms-dev-shares`, and `dms-dev-favorites`
- Frontend: AWS Amplify production branch `main`

The stack and application workflows were deployed and exercised in `ap-southeast-1`, then the project resources were cleaned up on November 19, 2026. The identifiers above describe that completed deployment; they are not an active environment. Review the CloudFormation change set before a future deployment; AWS resources may incur charges.

## API routes and behavior

- `GET /health` is public and returns the service health response.
- `ANY /{proxy+}` invokes the document Lambda and is protected by the Cognito JWT authorizer.
- `OPTIONS /{proxy+}` is unauthenticated to support CORS preflight.
- Authenticated document routes cover upload URL/completion, owned/trash/shared lists, document details and metadata, download URL, trash/restore/permanent delete, share/revoke, and Favorites.
- Lambda derives the caller `sub` from API Gateway's verified JWT claims. Ownership is not accepted from request JSON.
- Upload/download use short-lived S3 presigned URLs. The browser transfers file bytes directly to the private S3 bucket.
- Uploads are limited to 20 MiB and the extensions accepted by the current frontend. The deployed API returned HTTP `400` for an authenticated upload-url request specifying 20 MiB + 1 byte; the evidence is in the workshop report, section 5.10.1.

## AWS permissions

Both Lambda functions used the configured `LambdaExecutionRoleArn` parameter. The captured role permission screen showed `AWSLambdaBasicExecutionRole` and the project runtime policy attached. The policy source files are:

- `iam/lambda-runtime-policy.template.json`
- `iam/lambda-runtime-policy.ap-southeast-1.json`

The runtime policy scopes DynamoDB access to the three project tables/indexes, S3 access to the documents bucket prefix, and Cognito lookup access to the project User Pool. The IAM role was removed during cleanup. Do not grant `AdministratorAccess` to the Lambda role if redeploying.

## Observability

The deployed environment's screenshots recorded Lambda `START`/`END`/`REPORT` events, API Gateway access logs, an error alarm, and a confirmed SNS email subscription in the workshop report, section 5.11.1. The current local source also includes a structured completion record for document Lambda invocations; this source change was not part of the cleaned-up deployment. It avoids logging raw paths, query values, request bodies, JWTs, and presigned URLs.

## Local commands

From this directory:

```powershell
sam validate --lint
sam build
sam local start-api --port 3000
```

The local health endpoint is `http://127.0.0.1:3000/health`. Authenticated routes need a valid Cognito JWT and AWS service access; the SAM local health check does not prove those integrations work.

For an authorized infrastructure update, use the appropriate AWS profile and inspect the proposed change set before confirming deployment. Do not store AWS credentials, JWTs, presigned URLs, or secrets in source control. Amplify builds the frontend separately from this backend folder.
