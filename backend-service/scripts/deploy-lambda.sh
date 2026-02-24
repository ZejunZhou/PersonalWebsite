#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# deploy-lambda.sh — Interactive deploy of FastAPI backend to AWS Lambda
#
# Prompts for all required values. No secrets are ever hardcoded.
# Already-set env vars are used as defaults (skip the prompt).
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Docker (for cross-platform Lambda packaging)
#   - Python 3.11+ with pip (for local seed step only)
#   - zip utility
#
# Usage:
#   bash scripts/deploy-lambda.sh            # first deploy (interactive)
#   SKIP_SEED=true bash scripts/deploy-lambda.sh  # code-only update
###############################################################################

# ── Helper: prompt with default (uses env var if already set) ────────────────
ask() {
    local var_name="$1" prompt="$2" default="${3:-}"
    local current="${!var_name:-$default}"

    if [ -n "${current}" ]; then
        read -rp "  ${prompt} [${current}]: " input
        eval "${var_name}=\"${input:-${current}}\""
    else
        while true; do
            read -rp "  ${prompt}: " input
            if [ -n "${input}" ]; then
                eval "${var_name}=\"${input}\""
                return
            fi
            echo "    (required)"
        done
    fi
}

ask_secret() {
    local var_name="$1" prompt="$2"
    local current="${!var_name:-}"

    if [ -n "${current}" ]; then
        read -rsp "  ${prompt} [****]: " input
        echo ""
        eval "${var_name}=\"${input:-${current}}\""
    else
        while true; do
            read -rsp "  ${prompt}: " input
            echo ""
            if [ -n "${input}" ]; then
                eval "${var_name}=\"${input}\""
                return
            fi
            echo "    (required)"
        done
    fi
}

# ── Collect configuration ────────────────────────────────────────────────────
echo "=== PersonalSite Lambda Deployment ==="
echo ""
echo "Configure (press Enter to accept defaults):"
echo ""

ask          AWS_REGION          "AWS Region"                   "us-east-1"
ask          ADMIN_EMAILS        "Admin emails (comma-sep)"     ""
ask          CORS_ORIGINS        "Allowed origins (comma-sep)"  "http://localhost:3000"
ask          FUNCTION_NAME       "Lambda function name"         "personalsite-api"
ask          ROLE_NAME           "IAM role name"                "personalsite-lambda-role"
ask          MEMORY_SIZE         "Lambda memory (MB)"           "256"
ask          TIMEOUT             "Lambda timeout (seconds)"     "30"

# JWT secret: auto-generate if not set
if [ -z "${JWT_SECRET_KEY:-}" ]; then
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    echo ""
    echo "  Generated JWT_SECRET_KEY (save this — you need it for redeployments):"
    echo "  ${JWT_SECRET_KEY}"
fi

# Seed password: only ask if seeding
if [ "${SKIP_SEED:-false}" != "true" ]; then
    echo ""
    ask_secret  SEED_ADMIN_PASSWORD "Seed admin password"
fi

# ── Verify AWS CLI identity ──────────────────────────────────────────────────
echo ""
echo "Verifying AWS credentials..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "${AWS_REGION}" 2>/dev/null) || {
    echo "ERROR: AWS CLI is not configured. Run 'aws configure' first."
    exit 1
}
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo "  Account:  ${ACCOUNT_ID}"
echo "  Region:   ${AWS_REGION}"
echo "  Function: ${FUNCTION_NAME}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BUILD_DIR="${PROJECT_DIR}/.build"
ZIP_PATH="${PROJECT_DIR}/lambda.zip"

# ── Step 1: IAM Role ────────────────────────────────────────────────────────
echo "[1/5] IAM role..."
if aws iam get-role --role-name "${ROLE_NAME}" > /dev/null 2>&1; then
    echo "  Role '${ROLE_NAME}' already exists."
else
    TRUST_POLICY=$(cat <<'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
POLICY
)
    aws iam create-role \
        --role-name "${ROLE_NAME}" \
        --assume-role-policy-document "${TRUST_POLICY}" > /dev/null

    aws iam attach-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

    aws iam attach-role-policy \
        --role-name "${ROLE_NAME}" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    echo "  Created role + attached policies. Waiting 10s for IAM propagation..."
    sleep 10
fi

# ── Step 2: Package (Docker-based for Linux-compatible wheels) ──────────────
echo "[2/6] Packaging Lambda..."
rm -rf "${BUILD_DIR}" "${ZIP_PATH}"
mkdir -p "${BUILD_DIR}"

if ! command -v docker &> /dev/null; then
    echo "  ERROR: Docker is required for cross-platform packaging."
    echo "  pip install on macOS produces darwin wheels that crash on Lambda."
    exit 1
fi

echo "  Installing dependencies via Docker (Amazon Linux x86_64)..."
docker run --rm --platform linux/amd64 \
    -v "${PROJECT_DIR}:/var/task" \
    --entrypoint "" \
    public.ecr.aws/lambda/python:3.11 \
    pip install -q -r /var/task/requirements.txt -t /var/task/.build/

cp -r "${PROJECT_DIR}/app" "${PROJECT_DIR}/main.py" "${PROJECT_DIR}/handler.py" "${BUILD_DIR}/"

(cd "${BUILD_DIR}" && zip -r9q "${ZIP_PATH}" .)
rm -rf "${BUILD_DIR}"

ZIP_SIZE=$(du -sh "${ZIP_PATH}" | cut -f1)
echo "  Package: ${ZIP_SIZE}"

# ── Step 3: Create / Update Lambda ──────────────────────────────────────────
echo "[3/5] Deploying Lambda function..."

ENV_JSON=$(cat <<EOF
{
  "Variables": {
    "DEPLOY_ENV": "cloud",
    "JWT_SECRET_KEY": "${JWT_SECRET_KEY}",
    "ADMIN_EMAILS": "${ADMIN_EMAILS}",
    "CORS_ORIGINS": "${CORS_ORIGINS}",
    "COOKIE_SECURE": "true",
    "COOKIE_SAMESITE": "none"
  }
}
EOF
)

if aws lambda get-function --function-name "${FUNCTION_NAME}" --region "${AWS_REGION}" > /dev/null 2>&1; then
    aws lambda update-function-code \
        --function-name "${FUNCTION_NAME}" \
        --zip-file "fileb://${ZIP_PATH}" \
        --region "${AWS_REGION}" > /dev/null

    aws lambda wait function-updated \
        --function-name "${FUNCTION_NAME}" \
        --region "${AWS_REGION}"

    aws lambda update-function-configuration \
        --function-name "${FUNCTION_NAME}" \
        --environment "${ENV_JSON}" \
        --timeout "${TIMEOUT}" \
        --memory-size "${MEMORY_SIZE}" \
        --region "${AWS_REGION}" > /dev/null

    echo "  Updated existing function."
else
    aws lambda create-function \
        --function-name "${FUNCTION_NAME}" \
        --runtime python3.11 \
        --handler handler.handler \
        --role "${ROLE_ARN}" \
        --zip-file "fileb://${ZIP_PATH}" \
        --timeout "${TIMEOUT}" \
        --memory-size "${MEMORY_SIZE}" \
        --environment "${ENV_JSON}" \
        --region "${AWS_REGION}" > /dev/null

    aws lambda wait function-active \
        --function-name "${FUNCTION_NAME}" \
        --region "${AWS_REGION}"

    echo "  Created new function."
fi

# ── Step 4: Function URL ───────────────────────────────────────────────────
echo "[4/5] Function URL..."
FUNCTION_URL=$(aws lambda get-function-url-config \
    --function-name "${FUNCTION_NAME}" \
    --region "${AWS_REGION}" \
    --query 'FunctionUrl' --output text 2>/dev/null || true)

if [ -n "${FUNCTION_URL}" ] && [ "${FUNCTION_URL}" != "None" ]; then
    echo "  Function URL already configured."
else
    aws lambda create-function-url-config \
        --function-name "${FUNCTION_NAME}" \
        --auth-type NONE \
        --region "${AWS_REGION}" > /dev/null

    aws lambda add-permission \
        --function-name "${FUNCTION_NAME}" \
        --statement-id FunctionURLPublicAccess \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE \
        --region "${AWS_REGION}" > /dev/null 2>&1 || true

    FUNCTION_URL=$(aws lambda get-function-url-config \
        --function-name "${FUNCTION_NAME}" \
        --region "${AWS_REGION}" \
        --query 'FunctionUrl' --output text)

    echo "  Created Function URL."
fi

# ── Step 5: Seed Cloud DynamoDB ────────────────────────────────────────────
if [ "${SKIP_SEED:-false}" = "true" ]; then
    echo "[5/5] Skipping DB seed (SKIP_SEED=true)."
else
    echo "[5/5] Seeding cloud DynamoDB..."
    docker run --rm \
        -v "${PROJECT_DIR}:/var/task" \
        -v "${HOME}/.aws:/root/.aws:ro" \
        -e DEPLOY_ENV=cloud \
        -e AWS_DEFAULT_REGION="${AWS_REGION}" \
        -e SEED_ADMIN_PASSWORD="${SEED_ADMIN_PASSWORD}" \
        --entrypoint "" \
        public.ecr.aws/lambda/python:3.11 \
        sh -c "pip install -q -r /var/task/requirements.txt && python /var/task/scripts/seed_db.py"
fi

# ── Cleanup ─────────────────────────────────────────────────────────────────
rm -f "${ZIP_PATH}"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=== Deployment Complete ==="
echo ""
echo "  Function URL:  ${FUNCTION_URL}"
echo "  Health check:  curl ${FUNCTION_URL}api/health"
echo "  Swagger docs:  ${FUNCTION_URL}docs"
echo ""
echo "  Next steps:"
echo "    1. Set frontend REACT_APP_API_URL=${FUNCTION_URL%/}"
echo "    2. Redeploy frontend"
echo ""
echo "  To update code only (no seed, no prompts):"
echo "    JWT_SECRET_KEY=<your-key> ADMIN_EMAILS=<emails> CORS_ORIGINS=<url> \\"
echo "    SKIP_SEED=true bash scripts/deploy-lambda.sh"
