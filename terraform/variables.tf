# Input variable definitions

variable "website_bucket_name" {
  description = "Name of the s3 bucket. Must be unique."
  type        = string
  default     = "website-s3-bucket"
}

variable "tags" {
  description = "Tags to set on the bucket."
  type        = map(string)
  default     = {}
}

variable "pdf_bucket_name"{
  description   = "Bucket for saving users pdf uploads"
  type          = string
  default       = "pdf-s3-bucket"
}