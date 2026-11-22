import { randomUUID } from "node:crypto";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const cognito = new CognitoIdentityProviderClient({});
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "pptx", "txt"]);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
};

const identity = (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims?.sub) throw new HttpError(401, "Authentication is required");
  return { sub: claims.sub, email: claims.email?.toLowerCase() ?? claims.username ?? claims.sub };
};

const documentDto = (item, caller, shares = [], isFavorited = false) => ({
  documentId: item.documentId,
  fileName: item.fileName,
  fileType: item.fileType,
  fileSize: item.fileSize,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  owner: item.ownerEmail || item.ownerSub,
  status: item.uploadStatus === "ACTIVE" ? "active" : "processing",
  uploadStatus: item.uploadStatus,
  s3Key: item.s3Key,
  description: item.description || "",
  category: item.category || "Other",
  tags: item.tags || [],
  deletedAt: item.deletedAt || null,
  sharedWith: shares.map((share) => share.recipientEmail).filter(Boolean),
  shares: shares.map((share) => ({
    recipientSub: share.recipientSub,
    recipientEmail: share.recipientEmail,
    permission: share.permission,
    sharedAt: share.sharedAt,
  })),
  favoritedBy: isFavorited ? [caller.email] : [],
});

const getDocument = async (documentId) => {
  const result = await ddb.send(new GetCommand({
    TableName: process.env.DOCUMENTS_TABLE,
    Key: { documentId },
  }));
  return result.Item;
};

const assertReadable = async (item, caller) => {
  if (!item || item.uploadStatus !== "ACTIVE") throw new HttpError(404, "Document not found");
  if (item.ownerSub === caller.sub) return { owned: true, share: null };
  if (item.uploadStatus !== "ACTIVE" || item.deletedAt) throw new HttpError(404, "Document not found");
  const result = await ddb.send(new GetCommand({
    TableName: process.env.SHARES_TABLE,
    Key: { recipientSub: caller.sub, documentId: item.documentId },
  }));
  if (!result.Item) throw new HttpError(404, "Document not found");
  return { owned: false, share: result.Item };
};

const queryAll = async (input) => {
  const items = [];
  let ExclusiveStartKey;
  do {
    const result = await ddb.send(new QueryCommand({ ...input, ExclusiveStartKey, Limit: 100 }));
    items.push(...(result.Items || []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

const getFavoriteIds = async (sub) => {
  const items = await queryAll({
    TableName: process.env.FAVORITES_TABLE,
    KeyConditionExpression: "userSub = :userSub",
    ExpressionAttributeValues: { ":userSub": sub },
  });
  return new Set(items.map((item) => item.documentId));
};

const ownerShares = (ownerSub) => queryAll({
  TableName: process.env.SHARES_TABLE,
  IndexName: "OwnerShareIndex",
  KeyConditionExpression: "ownerSub = :ownerSub",
  ExpressionAttributeValues: { ":ownerSub": ownerSub },
});

const getSharesForDocument = async (documentId, ownerSub) =>
  (await ownerShares(ownerSub)).filter((share) => share.documentId === documentId);

const batchGetDocuments = async (documentIds) => {
  const found = [];
  for (let offset = 0; offset < documentIds.length; offset += 100) {
    let keys = documentIds.slice(offset, offset + 100).map((documentId) => ({ documentId }));
    let attempts = 0;
    while (keys.length && attempts < 5) {
      const result = await ddb.send(new BatchGetCommand({
        RequestItems: { [process.env.DOCUMENTS_TABLE]: { Keys: keys } },
      }));
      found.push(...(result.Responses?.[process.env.DOCUMENTS_TABLE] || []));
      keys = result.UnprocessedKeys?.[process.env.DOCUMENTS_TABLE]?.Keys || [];
      attempts += 1;
    }
    if (keys.length) throw new Error("DynamoDB batch read remained throttled");
  }
  return found;
};

const decorateDocuments = async (items, caller) => {
  const [favoriteIds, allOwnerShares] = await Promise.all([
    getFavoriteIds(caller.sub),
    items.some((item) => item.ownerSub === caller.sub) ? ownerShares(caller.sub) : Promise.resolve([]),
  ]);
  const sharesByDocument = new Map();
  for (const share of allOwnerShares) {
    const shares = sharesByDocument.get(share.documentId) || [];
    shares.push(share);
    sharesByDocument.set(share.documentId, shares);
  }
  return items.map((item) => documentDto(
    item,
    caller,
    item.ownerSub === caller.sub ? sharesByDocument.get(item.documentId) || [] : [],
    favoriteIds.has(item.documentId),
  ));
};

const requireOwner = (item, caller, notFound = true) => {
  if (!item) throw new HttpError(404, "Document not found");
  if (item.ownerSub !== caller.sub) throw new HttpError(notFound ? 404 : 403, "You are not allowed to change this document");
};

const listDocuments = async (event, caller) => {
  const view = event.queryStringParameters?.view || "owned";
  const status = event.queryStringParameters?.status || "active";
  if (!new Set(["active", "trash"]).has(status)) throw new HttpError(400, "status must be active or trash");
  if (view === "shared") return listShared(caller);
  if (view !== "owned") throw new HttpError(400, "view must be owned or shared");
  const items = await queryAll({
    TableName: process.env.DOCUMENTS_TABLE,
    IndexName: "OwnerIndex",
    KeyConditionExpression: "ownerSub = :ownerSub",
    ExpressionAttributeValues: { ":ownerSub": caller.sub },
    ScanIndexForward: false,
  });
  const selected = items.filter((item) => item.uploadStatus === "ACTIVE" && (status === "trash" ? Boolean(item.deletedAt) : !item.deletedAt));
  return json(200, { items: await decorateDocuments(selected, caller) });
};

const listShared = async (caller) => {
  const shares = await queryAll({
    TableName: process.env.SHARES_TABLE,
    KeyConditionExpression: "recipientSub = :recipientSub",
    ExpressionAttributeValues: { ":recipientSub": caller.sub },
  });
  const docs = await batchGetDocuments(shares.map((share) => share.documentId));
  const sharedDocs = docs.filter((item) => item.uploadStatus === "ACTIVE" && !item.deletedAt && item.ownerSub !== caller.sub);
  return json(200, { items: await decorateDocuments(sharedDocs, caller) });
};

const uploadUrl = async (body, caller) => {
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const fileSize = Number(body.fileSize);
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!fileName || fileName.length > 255 || /[\\/\x00-\x1f]/.test(fileName) || !extension || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new HttpError(400, "Unsupported or invalid file name");
  }
  if (!Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > MAX_FILE_BYTES) throw new HttpError(400, "File size must be between 1 byte and 20 MiB");
  const contentType = typeof body.contentType === "string" && body.contentType.length <= 150 ? body.contentType : "application/octet-stream";
  const documentId = randomUUID();
  const s3Key = `users/${caller.sub}/documents/${documentId}`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: process.env.DOCUMENTS_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    Metadata: { "document-id": documentId },
  }), { expiresIn: 300 });
  return json(200, {
    documentId,
    s3Key,
    uploadUrl,
    expiresIn: 300,
    requiredHeaders: {
      "Content-Type": contentType,
      "x-amz-meta-document-id": documentId,
    },
  });
};

const completeUpload = async (documentId, body, caller) => {
  const s3Key = `users/${caller.sub}/documents/${documentId}`;
  let object;
  try {
    object = await s3.send(new HeadObjectCommand({ Bucket: process.env.DOCUMENTS_BUCKET, Key: s3Key }));
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) throw new HttpError(409, "Uploaded object was not found in S3");
    throw error;
  }
  const fileSize = object.ContentLength || 0;
  if (fileSize < 1 || fileSize > MAX_FILE_BYTES) throw new HttpError(400, "Uploaded file size is outside the allowed limit");
  if (object.Metadata?.["document-id"] !== documentId) throw new HttpError(403, "S3 object metadata does not match this upload");
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!fileName || !ALLOWED_EXTENSIONS.has(extension)) throw new HttpError(400, "A supported fileName is required");
  const now = new Date().toISOString();
  const item = {
    documentId,
    ownerSub: caller.sub,
    ownerEmail: caller.email,
    fileName,
    fileType: extension,
    contentType: object.ContentType || "application/octet-stream",
    fileSize,
    s3Key,
    description: typeof body.description === "string" ? body.description.slice(0, 2000) : "",
    category: typeof body.category === "string" ? body.category.slice(0, 80) : "Other",
    tags: Array.isArray(body.tags) ? [...new Set(body.tags.filter((tag) => typeof tag === "string").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 30) : [],
    uploadStatus: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    createdAtDocumentId: `${now}#${documentId}`,
  };
  try {
    await ddb.send(new PutCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(documentId)",
    }));
  } catch (error) {
    if (error.name !== "ConditionalCheckFailedException") throw error;
    const existing = await getDocument(documentId);
    if (existing?.ownerSub !== caller.sub) throw new HttpError(409, "Document ID is already in use");
    return json(200, documentDto(existing, caller));
  }
  return json(201, documentDto(item, caller));
};

const getFavorites = async (caller) => {
  const favoriteIds = [...await getFavoriteIds(caller.sub)];
  const docs = await batchGetDocuments(favoriteIds);
  const readable = [];
  for (const item of docs) {
    try {
      await assertReadable(item, caller);
      readable.push(item);
    } catch (error) {
      if (!(error instanceof HttpError) || error.statusCode !== 404) throw error;
    }
  }
  return json(200, { items: await decorateDocuments(readable, caller) });
};

const favorite = async (documentId, caller, enabled) => {
  const item = await getDocument(documentId);
  await assertReadable(item, caller);
  const key = { userSub: caller.sub, documentId };
  if (enabled) {
    await ddb.send(new PutCommand({
      TableName: process.env.FAVORITES_TABLE,
      Item: { ...key, documentIdUserSub: `${documentId}#${caller.sub}`, favoritedAt: new Date().toISOString() },
    }));
  } else {
    await ddb.send(new DeleteCommand({ TableName: process.env.FAVORITES_TABLE, Key: key }));
  }
  return json(200, documentDto(item, caller, [], enabled));
};

const updateDocument = async (documentId, body, caller) => {
  const item = await getDocument(documentId);
  requireOwner(item, caller);
  const updates = {};
  for (const field of ["description", "category"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") throw new HttpError(400, `${field} must be a string`);
      updates[field] = body[field].slice(0, field === "description" ? 2000 : 80);
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 30 || body.tags.some((tag) => typeof tag !== "string")) throw new HttpError(400, "tags must be an array of up to 30 strings");
    updates.tags = [...new Set(body.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
  }
  if (!Object.keys(updates).length) throw new HttpError(400, "Provide description, category, or tags to update");
  const names = {};
  const values = { ":updatedAt": new Date().toISOString() };
  const sets = ["updatedAt = :updatedAt"];
  for (const [field, value] of Object.entries(updates)) {
    names[`#${field}`] = field;
    values[`:${field}`] = value;
    sets.push(`#${field} = :${field}`);
  }
  const result = await ddb.send(new UpdateCommand({
    TableName: process.env.DOCUMENTS_TABLE,
    Key: { documentId },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ConditionExpression: "ownerSub = :ownerSub AND uploadStatus = :active",
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: { ...values, ":ownerSub": caller.sub, ":active": "ACTIVE" },
    ReturnValues: "ALL_NEW",
  }));
  return json(200, documentDto(result.Attributes, caller, await getSharesForDocument(documentId, caller.sub), await getFavoriteIds(caller.sub).then((ids) => ids.has(documentId))));
};

const setTrashState = async (documentId, caller, restore) => {
  const item = await getDocument(documentId);
  requireOwner(item, caller);
  const now = new Date().toISOString();
  try {
    const result = await ddb.send(new UpdateCommand({
      TableName: process.env.DOCUMENTS_TABLE,
      Key: { documentId },
      UpdateExpression: restore ? "SET updatedAt = :now REMOVE deletedAt" : "SET deletedAt = :now, updatedAt = :now",
      ConditionExpression: restore ? "ownerSub = :owner AND attribute_exists(deletedAt) AND uploadStatus = :active" : "ownerSub = :owner AND attribute_not_exists(deletedAt) AND uploadStatus = :active",
      ExpressionAttributeValues: { ":now": now, ":owner": caller.sub, ":active": "ACTIVE" },
      ReturnValues: "ALL_NEW",
    }));
    const shares = await getSharesForDocument(documentId, caller.sub);
    return json(200, documentDto(result.Attributes, caller, shares, await getFavoriteIds(caller.sub).then((ids) => ids.has(documentId))));
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") throw new HttpError(409, restore ? "Document is not in Trash" : "Document is already in Trash");
    throw error;
  }
};

const resolveRecipient = async (email) => {
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new HttpError(400, "A valid recipient email is required");
  const result = await cognito.send(new ListUsersCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Filter: `email = "${normalized.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`,
    Limit: 2,
  }));
  const user = result.Users?.find((entry) => entry.Enabled !== false && entry.UserStatus !== "ARCHIVED");
  if (!user?.Username) throw new HttpError(404, "Recipient not found");
  const sub = user.Attributes?.find((attribute) => attribute.Name === "sub")?.Value;
  const actualEmail = user.Attributes?.find((attribute) => attribute.Name === "email")?.Value?.toLowerCase();
  if (!sub || actualEmail !== normalized) throw new HttpError(404, "Recipient not found");
  return { sub, email: actualEmail };
};

const createShare = async (documentId, body, caller) => {
  const item = await getDocument(documentId);
  requireOwner(item, caller);
  if (item.deletedAt || item.uploadStatus !== "ACTIVE") throw new HttpError(409, "Only active documents can be shared");
  const recipient = await resolveRecipient(body.email);
  if (recipient.sub === caller.sub) throw new HttpError(400, "A document cannot be shared with its owner");
  const share = {
    recipientSub: recipient.sub,
    documentId,
    ownerSub: caller.sub,
    recipientEmail: recipient.email,
    permission: "VIEWER",
    sharedAt: new Date().toISOString(),
    documentIdRecipientSub: `${documentId}#${recipient.sub}`,
  };
  try {
    await ddb.send(new PutCommand({
      TableName: process.env.SHARES_TABLE,
      Item: share,
      ConditionExpression: "attribute_not_exists(recipientSub) AND attribute_not_exists(documentId)",
    }));
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") throw new HttpError(409, "Document is already shared with this user");
    throw error;
  }
  const shares = await getSharesForDocument(documentId, caller.sub);
  return json(201, documentDto(item, caller, shares, await getFavoriteIds(caller.sub).then((ids) => ids.has(documentId))));
};

const revokeShare = async (documentId, recipientSub, caller) => {
  const item = await getDocument(documentId);
  requireOwner(item, caller);
  try {
    await ddb.send(new DeleteCommand({
      TableName: process.env.SHARES_TABLE,
      Key: { recipientSub, documentId },
      ConditionExpression: "ownerSub = :owner",
      ExpressionAttributeValues: { ":owner": caller.sub },
    }));
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") throw new HttpError(404, "Share not found");
    throw error;
  }
  return json(200, documentDto(item, caller, await getSharesForDocument(documentId, caller.sub), await getFavoriteIds(caller.sub).then((ids) => ids.has(documentId))));
};

const deleteInBatches = async (tableName, items, keyOf) => {
  for (let offset = 0; offset < items.length; offset += 25) {
    let requests = items.slice(offset, offset + 25).map((item) => ({ DeleteRequest: { Key: keyOf(item) } }));
    let attempts = 0;
    while (requests.length && attempts < 5) {
      const result = await ddb.send(new BatchWriteCommand({ RequestItems: { [tableName]: requests } }));
      requests = result.UnprocessedItems?.[tableName] || [];
      attempts += 1;
    }
    if (requests.length) throw new Error(`DynamoDB cleanup remained throttled for ${tableName}`);
  }
};

const permanentlyDelete = async (documentId, caller) => {
  const item = await getDocument(documentId);
  requireOwner(item, caller);
  await ddb.send(new UpdateCommand({
    TableName: process.env.DOCUMENTS_TABLE,
    Key: { documentId },
    UpdateExpression: "SET uploadStatus = :deleting, updatedAt = :now",
    ConditionExpression: "ownerSub = :owner",
    ExpressionAttributeValues: { ":deleting": "DELETING", ":now": new Date().toISOString(), ":owner": caller.sub },
  }));
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.DOCUMENTS_BUCKET, Key: item.s3Key }));
  const [shares, favorites] = await Promise.all([
    ownerShares(caller.sub).then((all) => all.filter((share) => share.documentId === documentId)),
    queryAll({
      TableName: process.env.FAVORITES_TABLE,
      IndexName: "DocumentFavoritesIndex",
      KeyConditionExpression: "documentId = :documentId",
      ExpressionAttributeValues: { ":documentId": documentId },
    }),
  ]);
  await Promise.all([
    deleteInBatches(process.env.SHARES_TABLE, shares, (share) => ({ recipientSub: share.recipientSub, documentId: share.documentId })),
    deleteInBatches(process.env.FAVORITES_TABLE, favorites, (favorite) => ({ userSub: favorite.userSub, documentId: favorite.documentId })),
  ]);
  await ddb.send(new DeleteCommand({ TableName: process.env.DOCUMENTS_TABLE, Key: { documentId }, ConditionExpression: "ownerSub = :owner", ExpressionAttributeValues: { ":owner": caller.sub } }));
  return json(200, { success: true });
};

const downloadUrl = async (item) => {
  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.DOCUMENTS_BUCKET, Key: item.s3Key }), { expiresIn: 300 });
  return json(200, { downloadUrl: url, expiresIn: 300, fileName: item.fileName });
};

const handleApiRequest = async (event) => {
  const routeKey = event?.requestContext?.routeKey;
  const method = event.requestContext?.http?.method || event.httpMethod;
  // API Gateway routes preflight requests here without requiring a Cognito token.
  if (method === "OPTIONS") return { statusCode: 204, headers: {}, body: "" };
  if (routeKey === "GET /health") return json(200, { status: "ok", service: "dms-api" });

  try {
    const caller = identity(event);
    const path = event.rawPath || event.path || "/";
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    const body = parseBody(event);

    if (method === "GET" && parts.join("/") === "documents") return await listDocuments(event, caller);
    if (method === "GET" && parts.join("/") === "documents/shared") return await listShared(caller);
    if (method === "POST" && parts.join("/") === "documents/upload-url") return await uploadUrl(body, caller);
    if (method === "GET" && parts.join("/") === "favorites") return await getFavorites(caller);
    if (parts[0] === "documents" && parts[1] && parts[2] === "favorite" && parts.length === 3) {
      if (method === "PUT") return await favorite(parts[1], caller, true);
      if (method === "DELETE") return await favorite(parts[1], caller, false);
    }
    if (parts[0] === "documents" && parts[1] && parts.length >= 2) {
      const [, documentId, action, recipientSub] = parts;
      if (action === "complete" && method === "POST" && parts.length === 3) return await completeUpload(documentId, body, caller);
      if (action === "download-url" && method === "GET" && parts.length === 3) {
        const item = await getDocument(documentId);
        await assertReadable(item, caller);
        if (item.deletedAt || item.uploadStatus !== "ACTIVE") throw new HttpError(404, "Document not found");
        return await downloadUrl(item);
      }
      if (action === "trash" && method === "POST" && parts.length === 3) return await setTrashState(documentId, caller, false);
      if (action === "restore" && method === "POST" && parts.length === 3) return await setTrashState(documentId, caller, true);
      if (action === "shares" && method === "POST" && parts.length === 3) return await createShare(documentId, body, caller);
      if (action === "shares" && method === "DELETE" && recipientSub && parts.length === 4) return await revokeShare(documentId, recipientSub, caller);
      if (!action && method === "GET" && parts.length === 2) {
        const item = await getDocument(documentId);
        const access = await assertReadable(item, caller);
        const [shares, favorites] = access.owned ? await Promise.all([getSharesForDocument(documentId, caller.sub), getFavoriteIds(caller.sub)]) : [[access.share], await getFavoriteIds(caller.sub)];
        return json(200, documentDto(item, caller, shares, favorites.has(documentId)));
      }
      if (!action && method === "PATCH" && parts.length === 2) return await updateDocument(documentId, body, caller);
      if (!action && method === "DELETE" && parts.length === 2) return await permanentlyDelete(documentId, caller);
    }
    throw new HttpError(404, "Route not found");
  } catch (error) {
    if (error instanceof HttpError) return json(error.statusCode, { message: error.message });
    if (error.name === "ConditionalCheckFailedException") return json(409, { message: "The requested change conflicts with the current state" });
    console.error("Unhandled API error", { name: error.name, message: error.message });
    return json(500, { message: "Internal server error" });
  }
};

export const handler = async (event) => {
  const startedAt = Date.now();
  const requestId = event?.requestContext?.requestId || "unknown";
  const method = event?.requestContext?.http?.method || event?.httpMethod || "unknown";
  // Prefer the API Gateway route template so document IDs and query values are not logged.
  const route = event?.requestContext?.routeKey || "unknown";

  const response = await handleApiRequest(event);

  console.info("API request completed", {
    requestId,
    method,
    route,
    statusCode: response?.statusCode ?? 500,
    durationMs: Date.now() - startedAt,
  });

  return response;
};
