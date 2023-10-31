#------------Pdf S3 bucket configuration----------------------
resource "aws_s3_bucket" "pdf_s3_bucket" {
  bucket = var.pdf_bucket_name
}

resource "aws_s3_bucket_policy" "pdf_bucket_policy"{
bucket = aws_s3_bucket.pdf_s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject", "s3:PutObject"]
        Resource = [
          aws_s3_bucket.pdf_s3_bucket.arn,
          "${aws_s3_bucket.pdf_s3_bucket.arn}/*",
        ]
      },
    ]
  })
}
