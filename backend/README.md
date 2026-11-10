# DMS serverless backend

This folder contains the AWS SAM infrastructure and Lambda API source for the document management project. It is not deployed just by being added here.

## Implemented routes

- Public `GET /health` for a local or deployed availability check.
- Cognito-authenticated document routes: upload URL, upload completion, owned/trash/shared lists, document detail and metadata update, download URL, trash/restore/permanent delete, share/revoke, and favorites.
- File upload/download uses short-lived S3 presigned URLs; the browser sends file bytes directly to the private bucket.
- Lambda derives the caller `sub` from API Gateway's verified JWT claims. Ownership is never accepted from request JSON.
- Uploads are limited to 20 MiB and the file extensions accepted by the current frontend.

The document Lambda uses the AWS SDK for JavaScript v3 supplied by the Node.js Lambda runtime. AWS can update that runtime copy; bundle pinned SDK packages if the project later needs a fixed SDK version. [AWS runtime dependency documentation](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html).

## IAM permissions required by the Lambda role

The pre-created `dms-lambda-execution` role currently has CloudWatch Logs access. Before document routes can operate against AWS, attach a least-privilege policy based on `iam/lambda-runtime-policy.template.json`, replacing the resource placeholders with the exact stack table, bucket, Cognito pool, account, and Region values. The `dms-dev` user cannot attach policies to IAM roles; use the account's authorized administrator for that step. Do not grant `AdministratorAccess` to the Lambda role.

## Before deployment

1. Create and verify the AWS Budget alert in the account.
2. Confirm the AWS CLI identity is `user/dms-dev`, Region is `ap-southeast-1`, and the role ARN parameter is the dedicated `dms-lambda-execution` role.
3. Review the resource names, IAM policy, and deployment plan. `sam deploy` creates AWS resources that may incur charges; this scaffold has not been deployed.
4. Verify the budget, role permissions, and cleanup plan before provisioning.

## Local commands

From this directory:

```powershell
sam validate --lint
sam build
sam local start-api --port 3000
```

The local health endpoint is `http://127.0.0.1:3000/health`. Authenticated routes need a valid Cognito JWT and AWS service access; the SAM local health check does not prove those integrations work. Keep any generated `samconfig.toml` local; it is ignored by Git.
