# 🚚 wide-load

Experiment with wide events

# S3 connection to local dev

CREATE SECRET s3secret (
    TYPE S3,
    KEY_ID 'minio',
    SECRET 'miniominio',
    REGION 'us-east-1',
    USE_SSL false,
    URL_STYLE 'path',
    ENDPOINT 'localhost:31008'
);
